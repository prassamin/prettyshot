import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import {
  GRADIENT_PRESETS,
  MESH_GRADIENT_PRESETS,
  SHADOW_PRESETS,
} from "@/lib/presets";

/* ─── types ─── */

export interface EditorState {
  // DB identity
  designId: string | null;
  // Image
  image: string | null;
  imageName: string;
  // Background
  bgType: "gradient" | "mesh" | "solid" | "image" | "custom";
  bgGradient: string;
  bgMesh: string;
  bgSolid: string;
  bgImage: string | null;
  bgPremiumId: string | null;
  // Styling
  padding: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  deviceFrame: "none" | "macos" | "windows" | "glass" | "arc" | "chrome" | "iphone" | "tablet" | "minimal";
  browserUrl: string;
  setBrowserUrl: (url: string) => void;
  frameTheme: "light" | "dark";
  setFrameTheme: (theme: "light" | "dark") => void;
  shadowPreset: string;
  shadowColor: string;
  aspectRatio: number | null;
  isCustomAspectRatio: boolean;
  customAspectRatioWidth: number;
  customAspectRatioHeight: number;
  noiseOpacity: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  // Watermark
  showWatermark: boolean;
  watermarkText: string;
  watermarkPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  watermarkSize: number;
  // Export
  exportFormat: "png" | "jpg" | "webp";
  exportScale: 1 | 2 | 3 | 4;
  // Actions
  setDesignId: (id: string | null) => void;
  setImage: (dataUrl: string, name: string) => void;
  clearImage: () => void;
  setBgType: (type: EditorState["bgType"]) => void;
  setBgGradient: (className: string) => void;
  setBgMesh: (name: string) => void;
  setBgSolid: (hex: string) => void;
  setBgImage: (dataUrl: string) => void;
  setBgPremiumId: (id: string | null) => void;
  setPadding: (n: number) => void;
  setBorderRadius: (n: number) => void;
  setBorderWidth: (n: number) => void;
  setBorderColor: (color: string) => void;
  setDeviceFrame: (frame: EditorState["deviceFrame"]) => void;
  setShadowPreset: (name: string) => void;
  setShadowColor: (hex: string) => void;
  setAspectRatio: (value: number | null) => void;
  setIsCustomAspectRatio: (value: boolean) => void;
  setCustomAspectRatioWidth: (n: number) => void;
  setCustomAspectRatioHeight: (n: number) => void;
  setNoiseOpacity: (n: number) => void;
  setRotateX: (n: number) => void;
  setRotateY: (n: number) => void;
  setRotateZ: (n: number) => void;
  setShowWatermark: (show: boolean) => void;
  setWatermarkText: (text: string) => void;
  setWatermarkPosition: (pos: EditorState["watermarkPosition"]) => void;
  setWatermarkSize: (size: number) => void;
  setExportFormat: (fmt: EditorState["exportFormat"]) => void;
  setExportScale: (scale: EditorState["exportScale"]) => void;
  reset: () => void;
}

/* ─── defaults ─── */

const initialState = {
  designId: null,
  image: null,
  imageName: "",
  bgType: "gradient" as const,
  bgGradient: GRADIENT_PRESETS[0].className,
  bgMesh: MESH_GRADIENT_PRESETS[0].src,
  bgSolid: "#ffffff",
  bgImage: null,
  bgPremiumId: null,
  padding: 16,
  borderRadius: 16,
  borderWidth: 0,
  borderColor: "rgba(255, 255, 255, 0.4)",
  deviceFrame: "none" as const,
  browserUrl: "prettyshot.site",
  frameTheme: "light" as const,
  shadowPreset: SHADOW_PRESETS[2].name, // "Medium"
  shadowColor: "#000000",
  aspectRatio: null,
  isCustomAspectRatio: false,
  customAspectRatioWidth: 16,
  customAspectRatioHeight: 9,
  noiseOpacity: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  showWatermark: true,
  watermarkText: "PrettyShot",
  watermarkPosition: "bottom-right" as const,
  watermarkSize: 100,
  exportFormat: "png" as const,
  exportScale: 2 as const,
};

/* ─── store ─── */

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      ...initialState,

      setDesignId: (designId) => set({ designId }),
      setImage: (dataUrl, name) => set({ image: dataUrl, imageName: name }),
      clearImage: () => set({ image: null, imageName: "" }),

      setBgType: (bgType) => set({ bgType }),
      setBgGradient: (bgGradient) => set({ bgGradient }),
      setBgMesh: (bgMesh) => set({ bgMesh }),
      setBgSolid: (bgSolid) => set({ bgSolid }),
      setBgImage: (bgImage) => set({ bgImage }),
      setBgPremiumId: (bgPremiumId) => set({ bgPremiumId }),

      setPadding: (padding) => set({ padding }),
      setBorderRadius: (borderRadius) => set({ borderRadius }),
      setBorderWidth: (borderWidth) => set({ borderWidth }),
      setBorderColor: (borderColor) => set({ borderColor }),
      setDeviceFrame: (deviceFrame) => set({ deviceFrame }),
      setBrowserUrl: (browserUrl) => set({ browserUrl }),
      setFrameTheme: (frameTheme) => set({ frameTheme }),
      setShadowPreset: (shadowPreset) => set({ shadowPreset }),
      setShadowColor: (shadowColor) => set({ shadowColor }),
      setAspectRatio: (aspectRatio) => set({ aspectRatio }),
      setIsCustomAspectRatio: (isCustomAspectRatio) => set({ isCustomAspectRatio }),
      setCustomAspectRatioWidth: (customAspectRatioWidth) =>
        set({ customAspectRatioWidth }),
      setCustomAspectRatioHeight: (customAspectRatioHeight) =>
        set({ customAspectRatioHeight }),
      setNoiseOpacity: (noiseOpacity) => set({ noiseOpacity }),
      setRotateX: (rotateX) => set({ rotateX }),
      setRotateY: (rotateY) => set({ rotateY }),
      setRotateZ: (rotateZ) => set({ rotateZ }),

      setShowWatermark: (showWatermark) => set({ showWatermark }),
      setWatermarkText: (watermarkText) => set({ watermarkText }),
      setWatermarkPosition: (watermarkPosition) => set({ watermarkPosition }),
      setWatermarkSize: (watermarkSize) => set({ watermarkSize }),

      setExportFormat: (exportFormat) => set({ exportFormat }),
      setExportScale: (exportScale) => set({ exportScale }),

      reset: () => set(initialState),
    }),
    {
      name: "prettyshot-editor-storage",
      partialize: (state) => {
        // We only persist config. Raw images should not be massive in localStorage, 
        // but if they are urls, it's fine. We keep them because otherwise refresh loses image.
        // We do want to persist everything so a refresh restores exactly where they were.
        return state;
      },
      storage: createJSONStorage(() => ({
        getItem: async (name: string): Promise<string | null> => {
          return (await get(name)) || null;
        },
        setItem: async (name: string, value: string): Promise<void> => {
          await set(name, value);
        },
        removeItem: async (name: string): Promise<void> => {
          await del(name);
        },
      })),
    }
  )
);
