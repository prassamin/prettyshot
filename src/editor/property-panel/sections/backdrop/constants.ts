import type {
  BackdropAdjustments,
  OverlayConfig,
  LightSourceConfig,
  LightTintPreset,
  FilterDescriptor,
} from "./types";

// Dynamic CSS Live Preview Token Keys
export const TOKEN_BACKDROP_FX_PREVIEW = "--ps-backdrop-filter-live";
export const TOKEN_BACKDROP_NOISE_PREVIEW = "--ps-backdrop-grain-level";
export const TOKEN_LIGHTING_IMAGE = "--ps-ambient-light-map";
export const TOKEN_LIGHTING_OPACITY = "--ps-ambient-light-density";
export const TOKEN_OVERLAY_OPACITY = "--ps-shadow-texture-alpha";
export const TOKEN_CANVAS_CORNER_RADIUS = "--ps-stage-corner-radius";

export const LIGHT_TINT_PRESETS: LightTintPreset[] = [
  { hex: "#FFFFFF", label: "Pure White" },
  { hex: "#DDF5FF", label: "Sky Glow" },
  { hex: "#D8FFE4", label: "Mint Fresh" },
  { hex: "#FFE8BD", label: "Warm Gold" },
  { hex: "#FFC7D6", label: "Sunset Rose" },
  { hex: "#E0C7FF", label: "Lavender" },
];

export const BACKDROP_FILTER_PRESETS: FilterDescriptor[] = [
  { id: "none", label: "Original", tag: "Natural", desc: "Clean original colors" },
  { id: "bw", label: "B&W", tag: "Mono", desc: "Pure black and white" },
  { id: "sepia", label: "Sepia", tag: "Antique", desc: "Warm retro 70s sepia" },
  { id: "vintage", label: "Vintage", tag: "Film", desc: "Nostalgic 90s analog film" },
  { id: "warm", label: "Warm", tag: "Sunset", desc: "Golden hour amber glow" },
  { id: "cool", label: "Cool", tag: "Arctic", desc: "Cool cyan steel tint" },
  { id: "fade", label: "Fade", tag: "Matte", desc: "Lifted blacks & matte shadows" },
  { id: "vivid", label: "Vivid", tag: "Punchy", desc: "High saturation & contrast" },
  { id: "noir", label: "Noir", tag: "Dramatic", desc: "High contrast dark shadows" },
  { id: "dream", label: "Dream", tag: "Glow", desc: "Soft focus dreamy glow" },
  { id: "mono", label: "Mono", tag: "Tinted", desc: "Warm muted monochrome" },
  { id: "invert", label: "Invert", tag: "Matrix", desc: "Inverted negative spectrum" },
];

export const SAMPLE_PREVIEW_PHOTO_URL =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=160&auto=format&fit=crop&q=80";

export const DEFAULT_ADJUSTMENTS: BackdropAdjustments = {
  noise: 0,
  blur: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  opacity: 100,
};

export const DEFAULT_OVERLAY: OverlayConfig = {
  id: null,
  opacity: 50,
  position: "overlay",
};

export const DEFAULT_LIGHT_SOURCE: LightSourceConfig = {
  target: "inner",
  intensity: 0,
  direction: "0-0",
  color: "#FFFFFF",
};
