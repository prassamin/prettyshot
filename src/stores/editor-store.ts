import { create } from "zustand";
import { GRADIENT_PRESETS, MESH_GRADIENT_PRESETS, SHADOW_PRESETS } from "@/lib/presets";

/* ─── types ─── */

export interface EditorState {
  // Image
  image: string | null;
  imageName: string;
  // Background
  bgType: "gradient" | "mesh" | "solid" | "image";
  bgGradient: string;
  bgMesh: string;
  bgSolid: string;
  bgImage: string | null;
  // Styling
  padding: number;
  borderRadius: number;
  shadowPreset: string;
  shadowColor: string;
  aspectRatio: number | null;
  noiseOpacity: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  // Export
  exportFormat: "png" | "jpg";
  exportScale: 1 | 2 | 3;
  // Actions
  setImage: (dataUrl: string, name: string) => void;
  clearImage: () => void;
  setBgType: (type: EditorState["bgType"]) => void;
  setBgGradient: (className: string) => void;
  setBgMesh: (name: string) => void;
  setBgSolid: (hex: string) => void;
  setBgImage: (dataUrl: string) => void;
  setPadding: (n: number) => void;
  setBorderRadius: (n: number) => void;
  setShadowPreset: (name: string) => void;
  setShadowColor: (hex: string) => void;
  setAspectRatio: (value: number | null) => void;
  setNoiseOpacity: (n: number) => void;
  setRotateX: (n: number) => void;
  setRotateY: (n: number) => void;
  setRotateZ: (n: number) => void;
  setExportFormat: (fmt: EditorState["exportFormat"]) => void;
  setExportScale: (scale: EditorState["exportScale"]) => void;
  reset: () => void;
}

/* ─── defaults ─── */

const initialState = {
  image: null,
  imageName: "",
  bgType: "gradient" as const,
  bgGradient: GRADIENT_PRESETS[0].className,
  bgMesh: MESH_GRADIENT_PRESETS[0].src,
  bgSolid: "#ffffff",
  bgImage: null,
  padding: 48,
  borderRadius: 16,
  shadowPreset: SHADOW_PRESETS[2].name, // "Medium"
  shadowColor: "#000000",
  aspectRatio: null,
  noiseOpacity: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  exportFormat: "png" as const,
  exportScale: 2 as const,
};

/* ─── store ─── */

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  setImage: (dataUrl, name) => set({ image: dataUrl, imageName: name }),
  clearImage: () => set({ image: null, imageName: "" }),

  setBgType: (bgType) => set({ bgType }),
  setBgGradient: (bgGradient) => set({ bgGradient }),
  setBgMesh: (bgMesh) => set({ bgMesh }),
  setBgSolid: (bgSolid) => set({ bgSolid }),
  setBgImage: (bgImage) => set({ bgImage }),

  setPadding: (padding) => set({ padding }),
  setBorderRadius: (borderRadius) => set({ borderRadius }),
  setShadowPreset: (shadowPreset) => set({ shadowPreset }),
  setShadowColor: (shadowColor) => set({ shadowColor }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setNoiseOpacity: (noiseOpacity) => set({ noiseOpacity }),
  setRotateX: (rotateX) => set({ rotateX }),
  setRotateY: (rotateY) => set({ rotateY }),
  setRotateZ: (rotateZ) => set({ rotateZ }),

  setExportFormat: (exportFormat) => set({ exportFormat }),
  setExportScale: (exportScale) => set({ exportScale }),

  reset: () => set(initialState),
}));
