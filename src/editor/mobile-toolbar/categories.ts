import {
  Blend,
  Crop,
  Frame as FrameIcon,
  Grid3x3,
  Image as ImageIcon,
  ImagePlus,
  Layers,
  Lightbulb,
  LineSquiggle,
  Maximize,
  MousePointer2,
  Move,
  Move3d,
  SlidersHorizontal,
  SquareDashed,
  SunMedium,
  SwatchBook,
  Type,
  RotateCcw,
} from "lucide-react";

export type CategoryId =
  | "pointer"
  | "extra_shot"
  | "asset"
  | "aspect"
  | "frame"
  | "fit"
  | "move"
  | "layers"
  | "text"
  | "annotate"
  | "background"
  | "filter"
  | "adjust"
  | "lighting"
  | "overlay"
  | "border"
  | "shadow"
  | "transform"
  | "reset";

export type Category = {
  id: CategoryId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const DESIGN_CATEGORIES: Category[] = [
  { id: "pointer", label: "Select", icon: MousePointer2 },
  { id: "extra_shot", label: "Extra Shot", icon: Grid3x3 },
  { id: "asset", label: "Add Image", icon: ImagePlus },
  { id: "text", label: "Text", icon: Type },
  { id: "annotate", label: "Annotation", icon: LineSquiggle },
  { id: "aspect", label: "Ratio", icon: Crop },
  { id: "fit", label: "Fit", icon: Maximize },
  { id: "move", label: "Move", icon: Move },
  { id: "layers", label: "Layers", icon: Layers },
];

export const TOOLS_CATEGORIES: Category[] = [
  { id: "background", label: "Background", icon: SwatchBook },
  { id: "frame", label: "Frame", icon: FrameIcon },
  { id: "filter", label: "Filter", icon: Blend },
  { id: "adjust", label: "Adjust", icon: SlidersHorizontal },
  { id: "lighting", label: "Lighting", icon: Lightbulb },
  { id: "overlay", label: "Overlay", icon: SunMedium },
  { id: "border", label: "Border", icon: SquareDashed },
  { id: "shadow", label: "Shadow", icon: ImageIcon },
  { id: "transform", label: "Transform", icon: Move3d },
  { id: "reset", label: "Reset", icon: RotateCcw },
];

export const ALL_CATEGORIES = [...DESIGN_CATEGORIES, ...TOOLS_CATEGORIES];

export const TALL_CATEGORIES = new Set<CategoryId>(["layers"]);
