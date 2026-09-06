import {
  Activity,
  Frame as FrameIcon,
  Image as ImageIcon,
  Layers,
  Move3d,
  SquareDashed,
  SwatchBook,
} from "lucide-react";
import type { PanelTool } from "@/editor/providers/panel-tool-provider";

export const TOOLS: {
  id: PanelTool;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "background", label: "Background", icon: SwatchBook },
  { id: "frame", label: "Frame", icon: FrameIcon },
  { id: "backdrop", label: "Backdrop", icon: Layers },
  { id: "border", label: "Border", icon: SquareDashed },
  { id: "transform", label: "Transform", icon: Move3d },
  { id: "shadow", label: "Shadow", icon: ImageIcon },
];
