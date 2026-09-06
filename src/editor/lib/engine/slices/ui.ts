import { DEFAULT_STATE } from "../../engine-core/initial-config";
import type { CanvasState } from "../types";
import type { EditorActions, EditorState, EditorStore } from "../types";

type SetPatch = Partial<EditorState> | ((state: EditorState) => Partial<EditorState>);

export function createUiActions(ctx: {
  set: (partial: Partial<EditorStore> | ((state: EditorStore) => Partial<EditorStore>)) => void;
  get: () => EditorStore;
  commit: (patch: SetPatch, group: string | null) => void;
}): Partial<EditorActions> {
  const { set, get, commit } = ctx;

  return {
    setActiveTool: (t) => commit({ activeTool: t }, null),
    setIsPreviewMode: (p) => set({ isPreviewMode: p }),
    setScreenshotPositionDragging: (dragging) => set({ screenshotPositionDragging: dragging }),
    setDesignId: (id) => set({ designId: id }),

    // Load a saved design into the store. Session-only fields (active tool,
    // annotation, zoom) keep their defaults; durable canvas fields merge over
    // the default state so a partial config still produces a valid canvas.
    hydrate: (canvas, opts) => {
      const state = get();
      const nextPresent: EditorState = {
        ...DEFAULT_STATE,
        ...canvas,
        aspect: canvas.aspect ?? DEFAULT_STATE.aspect,
        animation: canvas.animation ?? DEFAULT_STATE.animation,
      };
      set({
        past: opts?.resetHistory ? [] : state.past,
        present: nextPresent,
        future: [],
        _lastGroup: null,
        _lastTs: 0,
      });
    },

    undo: () => {
      const state = get();
      if (!state.past.length) return;
      const prev = state.past[state.past.length - 1];
      set({
        past: state.past.slice(0, -1), present: prev,
        future: [state.present, ...state.future],
        _lastGroup: null, _lastTs: 0,
      });
    },

    redo: () => {
      const state = get();
      if (!state.future.length) return;
      const next = state.future[0];
      set({
        past: [...state.past, state.present], present: next,
        future: state.future.slice(1),
        _lastGroup: null, _lastTs: 0,
      });
    },

    reset: () => {
      set({
        past: [],
        present: DEFAULT_STATE,
        future: [],
        _lastGroup: null,
        _lastTs: 0,
        selectedTextId: null,
        selectedAssetId: null,
        selectedAnnotationShapeId: null,
        selectedAnnotationStrokeId: null,
        selectedSlotId: null,
        isScreenshotSelected: false,
        saveStatus: "saved",
        saveError: null,
      });
    },

    setSaveStatus: (status, error = null) => {
      const current = get();
      if (current.saveStatus === status && current.saveError === error) return;
      set({
        saveStatus: status,
        saveError: error,
        lastSavedAt: status === "saved" ? Date.now() : current.lastSavedAt,
      });
    },

    requestSave: () => {
      const trigger = get()._saveTrigger;
      if (trigger) void trigger();
    },

    _registerSaveTrigger: (fn) => set({ _saveTrigger: fn }),
  };
}
