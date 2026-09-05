import { useEffect, useRef } from "react";
import { EditorState, useEditorEngine } from "@/editor/lib/engine";
import { useAppStore } from "@/stores/app-store";
import { replaceImageDeduplicated, deleteDesignAsset } from "@/lib/image-utils";
import { createClient as createLocalClient } from "@/lib/supabase/client";
import {
  loadDesignLocally,
  saveDesignLocally,
  deleteDesignLocally,
  rememberLocalDesign,
} from "@/editor/lib/local-design-storage";
import { saveDesignAction } from "@/app/actions/designs";
import { captureCanvasAsWebpBlob, findCanvasElement } from "@/editor/lib/export";
import { CANVAS_ID } from "@/editor/lib/engine-core/initial-config";
import { useFeatureGate } from "./use-feature-gate";

const LOCAL_SAVE_DEBOUNCE_MS = 1500; // 1.5s idle for local IndexedDB writes
const LOCAL_SAVING_STATE_DELAY_MS = 1000; // Show "Saving..." status 500ms before write
const CLOUD_SAVE_DEBOUNCE_MS = 2000; // 2s idle for batched network syncs

/** Strips session-only UI fields off `present` so only durable canvas content
 *  is persisted (active tool, in-progress annotation, canvas zoom are transient). */
function canvasConfig(state: EditorState) {
  const { activeTool, canvasZoom, annotation, ...canvasState } = state;
  return canvasState;
}

/** Collects every image-bearing field in the v2 canvas state that may still be
 *  a `data:` URL and uploads it to storage, returning the state with all
 *  images swapped for public URLs.
 *  When replacing an image, uploads the new one and deletes the old Cloudinary asset in parallel. */
async function uploadStateImages(
  state: any,
  designId?: string,
  previousState?: any,
): Promise<any> {
  const next = { ...state };

  const uploadOrReplace = async (
    newSrc: string | null | undefined,
    oldSrc?: string | null | undefined,
  ): Promise<string | null> => {
    if (!newSrc) {
      if (
        oldSrc &&
        typeof oldSrc === "string" &&
        oldSrc.startsWith("http") &&
        oldSrc.includes("cloudinary.com")
      ) {
        deleteDesignAsset(oldSrc).catch(() => {});
      }
      return newSrc as string | null;
    }
    if (newSrc.startsWith("http")) return newSrc;

    // Run parallel upload of new image + deletion of old Cloudinary asset
    return await replaceImageDeduplicated(newSrc, oldSrc, designId);
  };

  next.screenshot = await uploadOrReplace(
    state.screenshot,
    previousState?.screenshot,
  );

  if (state.originalScreenshot === state.screenshot) {
    next.originalScreenshot = next.screenshot;
  } else {
    next.originalScreenshot = await uploadOrReplace(
      state.originalScreenshot,
      previousState?.originalScreenshot,
    );
  }

  if (Array.isArray(next.slots)) {
    next.slots = await Promise.all(
      next.slots.map(async (slot: any, idx: number) => {
        const prevSlot =
          previousState?.slots?.find((s: any) => s.id === slot.id) ||
          previousState?.slots?.[idx];
        return {
          ...slot,
          src: await uploadOrReplace(slot.src, prevSlot?.src),
          originalSrc: await uploadOrReplace(
            slot.originalSrc,
            prevSlot?.originalSrc,
          ),
        };
      }),
    );
  }

  if (Array.isArray(next.assets)) {
    next.assets = await Promise.all(
      next.assets.map(async (asset: any, idx: number) => {
        const prevAsset =
          previousState?.assets?.find((a: any) => a.id === asset.id) ||
          previousState?.assets?.[idx];
        return {
          ...asset,
          src: await uploadOrReplace(asset.src, prevAsset?.src),
        };
      }),
    );
  }

  if (
    next.background?.type === "image" &&
    typeof next.background.value === "string" &&
    next.background.value.startsWith("data:")
  ) {
    const prevBg = previousState?.background?.value;
    const bgUrl = await uploadOrReplace(next.background.value, prevBg);
    next.background = {
      ...next.background,
      value: bgUrl || next.background.value,
      sourceUrl: bgUrl || next.background.sourceUrl,
    };
  }

  return next;
}

export function useAutoSave() {
  const { can } = useFeatureGate();
  const { user } = useAppStore();
  const isCloudSave = can("cloud.sync");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const localSavingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // Track the stringified version of what we last successfully saved
  const lastSavedStateRef = useRef<string>("");
  const previousConfigRef = useRef<any>(null);

  // Restore a locally-saved design once the design id is known.
  // When a user logs in as Pro, this seamlessly restores their local work and migrates it to the cloud.
  const designId = useEditorEngine((s) => s.designId);
  const currentDesignIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!designId || currentDesignIdRef.current === designId) return;
    currentDesignIdRef.current = designId;

    const engine = useEditorEngine.getState();
    void (async () => {
      try {
        const local = await loadDesignLocally(designId);
        if (local) {
          engine.hydrate(local as any, { resetHistory: true });
          if (!isCloudSave) {
            lastSavedStateRef.current = JSON.stringify(local);
            engine.setSaveStatus("saved");
          } else {
            // For Pro users: state was loaded from local browser, so mark it unsaved
            // so the cloud auto-saver immediately uploads and persists it to Supabase.
            lastSavedStateRef.current = "";
            engine.setSaveStatus("unsaved");
          }
        }
      } catch (e) {
        console.error("Local restore failed:", e);
      }
    })();
  }, [isCloudSave, designId]);

  useEffect(() => {
    // Free or anonymous users persist only to the browser (IndexedDB), keyed
    // by design id. Pro users sync to Supabase.
    if (!isCloudSave) {
      const triggerLocalSave = async () => {
        if (localSavingTimeoutRef.current) {
          clearTimeout(localSavingTimeoutRef.current);
          localSavingTimeoutRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (isSavingRef.current) return;
        isSavingRef.current = true;

        try {
          const engine = useEditorEngine.getState();
          let designId = engine.designId;
          if (!designId) {
            designId = crypto.randomUUID();
            engine.setDesignId(designId);
          }

          // Local saves keep data URLs intact (no upload needed) — full fidelity.
          const config = canvasConfig(engine.present);

          // A design only exists once the user has added content onto the canvas.
          const hasContent =
            Boolean(config.screenshot) ||
            (Array.isArray(config.slots) &&
              config.slots.some((s: any) => Boolean(s?.src))) ||
            (Array.isArray(config.texts) && config.texts.length > 0) ||
            (Array.isArray(config.assets) && config.assets.length > 0);

          if (!hasContent) {
            engine.setSaveStatus("saved");
            return;
          }

          const configString = JSON.stringify(config);
          if (configString === lastSavedStateRef.current) {
            engine.setSaveStatus("saved");
            return;
          }

          engine.setSaveStatus("saving");
          try {
            await saveDesignLocally(designId, config);
            rememberLocalDesign(designId);
            lastSavedStateRef.current = configString;
            engine.setSaveStatus("saved");
          } catch (e: any) {
            console.error("Local auto-save failed:", e);
            engine.setSaveStatus("error", e?.message || "Failed to save locally");
          }
        } finally {
          isSavingRef.current = false;
        }
      };

      const engine = useEditorEngine.getState();
      engine._registerSaveTrigger(triggerLocalSave);

      const unsubscribe = useEditorEngine.subscribe((state, prevState) => {
        if (state.present === prevState?.present) return;

        const currentConfig = canvasConfig(state.present);
        const hasContent =
          Boolean(currentConfig.screenshot) ||
          (Array.isArray(currentConfig.slots) &&
            currentConfig.slots.some((s: any) => Boolean(s?.src))) ||
          (Array.isArray(currentConfig.texts) && currentConfig.texts.length > 0) ||
          (Array.isArray(currentConfig.assets) && currentConfig.assets.length > 0);

        if (localSavingTimeoutRef.current) {
          clearTimeout(localSavingTimeoutRef.current);
          localSavingTimeoutRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        const isDirty =
          hasContent &&
          JSON.stringify(currentConfig) !== lastSavedStateRef.current;

        if (isDirty) {
          // Immediately show "Unsaved"
          state.setSaveStatus("unsaved");

          // Show "Saving..." 1000ms after user pauses
          localSavingTimeoutRef.current = setTimeout(() => {
            state.setSaveStatus("saving");
          }, LOCAL_SAVING_STATE_DELAY_MS);

          // Execute save 1500ms after user pauses (500ms after "Saving..." appears)
          timeoutRef.current = setTimeout(() => {
            triggerLocalSave();
          }, LOCAL_SAVE_DEBOUNCE_MS);
        }
      });

      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          if (localSavingTimeoutRef.current) {
            clearTimeout(localSavingTimeoutRef.current);
            localSavingTimeoutRef.current = null;
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          triggerLocalSave();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        unsubscribe();
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        if (localSavingTimeoutRef.current) clearTimeout(localSavingTimeoutRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        useEditorEngine.getState()._registerSaveTrigger(null);
      };
    }

    // ── Pro: cloud save (Supabase designs table) ─────────────────────────
    const standardSupabase = createLocalClient();

    const triggerSave = async () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (isSavingRef.current) return;
      isSavingRef.current = true;

      try {
        const engine = useEditorEngine.getState();

        // v2 engine state — `designId` lives on the store (set from the URL id or
        // minted on mount), while the canvas state lives under `present`.
        let designId = engine.designId;
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (!designId || !uuidRegex.test(designId)) {
          designId = crypto.randomUUID();
          engine.setDesignId(designId);
        }

        let config: any = canvasConfig(engine.present);

        // Nothing to save yet — a design only exists once the user has added content
        // (screenshot, slot, text, or asset) onto the canvas.
        const hasContent =
          Boolean(config.screenshot) ||
          (Array.isArray(config.slots) &&
            config.slots.some((s: any) => Boolean(s?.src))) ||
          (Array.isArray(config.texts) && config.texts.length > 0) ||
          (Array.isArray(config.assets) && config.assets.length > 0);

        if (!hasContent) {
          engine.setSaveStatus("saved");
          return;
        }

        const configString = JSON.stringify(config);
        if (configString === lastSavedStateRef.current) {
          engine.setSaveStatus("saved");
          return;
        }

        engine.setSaveStatus("saving");

        try {
          // Upload any local data URLs to Cloudinary CDN and swap for public URLs (replacing old Cloudinary assets in parallel)
          const prevConfig = previousConfigRef.current;
          config = await uploadStateImages(config, designId, prevConfig);
          previousConfigRef.current = config;

          const finalConfigString = JSON.stringify(config);

          const payload = {
            id: designId,
            user_id: user!.id,
            name: config.name || "Untitled Design",
            config,
            updated_at: new Date().toISOString(),
          };

          const res = await saveDesignAction(designId, config);
          if (!res.success) {
            const { error } = await standardSupabase
              .from("designs")
              .upsert(payload);
            if (error) throw error;
          }

          lastSavedStateRef.current = finalConfigString;
          engine.setSaveStatus("saved");
          deleteDesignLocally(designId).catch(() => {});

          // Capture exact canvas snapshot as lightweight WebP and upload directly to Supabase Storage
          void (async () => {
            try {
              const node = findCanvasElement(CANVAS_ID);
              if (node && user?.id) {
                const { data: authData } = await standardSupabase.auth.getUser();
                console.log("[Snapshot Debug] Browser auth user:", authData?.user?.id, "Store user:", user.id);

                const blob = await captureCanvasAsWebpBlob(CANVAS_ID, 1200, 0.85);
                const path = `snapshots/${user.id}/${designId}.webp`;
                const { data, error: uploadErr } = await standardSupabase.storage
                  .from("prettyshot")
                  .upload(path, blob, {
                    contentType: "image/webp",
                    upsert: true,
                  });

                if (uploadErr) {
                  console.error(
                    `[Snapshot Storage Upload Error] path="${path}" authUser="${authData?.user?.id}":`,
                    uploadErr.message,
                  );
                } else {
                  console.log("[Snapshot Upload Success]:", path, data);
                }
              }
            } catch (err) {
              console.warn("Background snapshot direct upload failed:", err);
            }
          })();
        } catch (e: any) {
          console.error("Auto-save failed:", e);
          engine.setSaveStatus("error", e?.message || "Failed to save design");
        }
      } finally {
        isSavingRef.current = false;
      }
    };

    const engine = useEditorEngine.getState();
    engine._registerSaveTrigger(triggerSave);

    // Subscribe to the v2 engine store for 2-second debounced saves
    const unsubscribe = useEditorEngine.subscribe((state, prevState) => {
      if (state.present === prevState?.present) return;

      const currentConfig = canvasConfig(state.present);
      const hasContent =
        Boolean(currentConfig.screenshot) ||
        (Array.isArray(currentConfig.slots) &&
          currentConfig.slots.some((s: any) => Boolean(s?.src))) ||
        (Array.isArray(currentConfig.texts) && currentConfig.texts.length > 0) ||
        (Array.isArray(currentConfig.assets) && currentConfig.assets.length > 0);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const isDirty =
        hasContent &&
        JSON.stringify(currentConfig) !== lastSavedStateRef.current;

      if (isDirty) {
        // Immediately show "Unsaved"
        state.setSaveStatus("unsaved");

        timeoutRef.current = setTimeout(() => {
          triggerSave();
        }, CLOUD_SAVE_DEBOUNCE_MS);
      }
    });

    // Intercept tab close / app switch for auto save
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        triggerSave();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      useEditorEngine.getState()._registerSaveTrigger(null);
    };
  }, [isCloudSave, user?.id]);
}
