import { useEffect, useRef } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { useAppStore } from "@/stores/app-store";
import { uploadImageDeduplicated } from "@/lib/image-utils";
import { createClient } from "@supabase/supabase-js"; // Use raw client to inject keepalive
import { createClient as createLocalClient } from "@/lib/supabase/client";

export function useAutoSave() {
  const { user } = useAppStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accessTokenRef = useRef<string | undefined>();
  
  // Track the stringified version of what we last successfully saved
  const lastSavedStateRef = useRef<string>("");

  useEffect(() => {
    if (!user || user.is_pro !== true) return;

    // Standard client for normal debounced saves
    const standardSupabase = createLocalClient();
    
    // Sync session token into memory so we don't have to await it during tab close
    standardSupabase.auth.getSession().then(({ data }) => {
      accessTokenRef.current = data.session?.access_token;
    });
    
    const { data: authListener } = standardSupabase.auth.onAuthStateChange((_event, session) => {
      accessTokenRef.current = session?.access_token;
    });

    const getKeepaliveClient = () => {
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: accessTokenRef.current ? {
              Authorization: `Bearer ${accessTokenRef.current}`
            } : undefined,
            fetch: (url, options) => fetch(url, { ...options, keepalive: true })
          }
        }
      );
    };

    const triggerSave = async (isClosingTab = false) => {
      const state = useEditorStore.getState();
      
      let finalImage = state.image;
      let finalBgImage = state.bgImage;
      let designId = state.designId;
      
      if (!designId) {
        designId = crypto.randomUUID();
        state.setDesignId(designId);
      }

      // If we are closing the tab, we cannot await large image uploads (browser will kill the process).
      // We must skip base64 uploads and just save the config.
      if (!isClosingTab) {
        if (finalImage && finalImage.startsWith("data:")) {
           finalImage = await uploadImageDeduplicated(finalImage);
           state.setImage(finalImage, state.imageName);
        }
        if (finalBgImage && finalBgImage.startsWith("data:")) {
           finalBgImage = await uploadImageDeduplicated(finalBgImage);
           state.setBgImage(finalBgImage);
        }
      } else {
        // If it's a huge base64 string on close, we can't save it to DB (too big).
        // Best we can do is null it out in the DB and let localStorage restore it next time on this device.
        if (finalImage?.startsWith("data:")) finalImage = null;
        if (finalBgImage?.startsWith("data:")) finalBgImage = null;
      }

      // Construct exactly what will be saved
      const config = { ...state, image: finalImage, bgImage: finalBgImage, designId };
      const configString = JSON.stringify(config);

      // Prevent redundant network requests if state hasn't changed since last save
      if (configString === lastSavedStateRef.current) return;

      const payload = {
        id: designId,
        user_id: user.id,
        name: state.imageName || "Untitled Design",
        config: config
      };

      try {
        if (isClosingTab) {
          const keepaliveClient = getKeepaliveClient();
          keepaliveClient.from("designs").upsert(payload).then();
        } else {
          const { error } = await standardSupabase.from("designs").upsert(payload);
          if (error) throw error;
        }
        
        lastSavedStateRef.current = configString;
      } catch (e) {
        console.error("Auto-save failed:", e);
      }
    };

    // 1. Subscribe to Zustand store for 3-second debounced saves
    const unsubscribe = useEditorStore.subscribe(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        triggerSave(false);
      }, 3000);
    });

    // 2. Intercept tab close / app switch for emergency background save
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        triggerSave(true);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsubscribe();
      authListener.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user]);
}
