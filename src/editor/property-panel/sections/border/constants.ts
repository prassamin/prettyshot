import type { BorderStyleOption } from "./types";

export const BORDER_COLOR_PRESETS = [
  "#ffffff",
  "#0f172a",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
] as const;

export const BORDER_STYLE_OPTIONS: BorderStyleOption[] = [
  {
    id: "none",
    label: "None",
  },
  {
    id: "solid",
    label: "Solid",
  },
  {
    id: "dashed",
    label: "Dashed",
  },
  {
    id: "dotted",
    label: "Dotted",
  },
  {
    id: "double",
    label: "Double",
  },
  {
    id: "groove",
    label: "Groove",
  },
  {
    id: "ridge",
    label: "Ridge",
  },
];
