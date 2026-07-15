/* ─── gradient presets ─── */

export interface GradientPreset {
  name: string;
  className: string;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    name: "Sunset",
    className: "bg-linear-to-br from-orange-400 via-rose-400 to-violet-500",
  },
  {
    name: "Ocean",
    className: "bg-linear-to-br from-cyan-400 via-blue-500 to-indigo-600",
  },
  {
    name: "Forest",
    className: "bg-linear-to-br from-emerald-400 via-green-500 to-teal-600",
  },
  {
    name: "Lavender",
    className: "bg-linear-to-br from-violet-400 via-purple-500 to-fuchsia-500",
  },
  {
    name: "Peach",
    className: "bg-linear-to-br from-orange-300 via-amber-300 to-yellow-400",
  },
  {
    name: "Berry",
    className: "bg-linear-to-br from-pink-500 via-rose-500 to-red-500",
  },
  {
    name: "Midnight",
    className: "bg-linear-to-br from-slate-800 via-zinc-900 to-neutral-950",
  },
  {
    name: "Sky",
    className: "bg-linear-to-br from-sky-300 via-blue-400 to-indigo-500",
  },
  {
    name: "Candy",
    className: "bg-linear-to-br from-pink-300 via-purple-300 to-indigo-400",
  },
  {
    name: "Fire",
    className: "bg-linear-to-br from-yellow-400 via-orange-500 to-red-600",
  },
  {
    name: "Mint",
    className: "bg-linear-to-br from-emerald-300 via-teal-400 to-cyan-500",
  },
  {
    name: "Slate",
    className: "bg-linear-to-br from-zinc-600 via-zinc-700 to-zinc-800",
  },
];

/* ─── shadow presets ─── */

export interface ShadowPreset {
  name: string;
  /** shadow template — use `{color}` as placeholder for user-chosen color */
  style: string;
  isGlow?: boolean;
}

export const SHADOW_PRESETS: ShadowPreset[] = [
  { name: "None", style: "none" },
  { name: "Soft", style: "0 8px 24px -4px {color}26" },
  { name: "Medium", style: "0 20px 50px -12px {color}40" },
  { name: "Hard", style: "0 25px 60px -8px {color}73" },
  { name: "Sharp", style: "8px 8px 0px 0px {color}33" },
  {
    name: "Elevated",
    style: "0 1px 2px {color}12, 0 4px 12px {color}0d, 0 16px 40px {color}1a",
  },
  { name: "Glow", style: "0 20px 60px -10px {color}66", isGlow: true },
];

/* ─── aspect ratio presets ─── */

export interface AspectRatioPreset {
  name: string;
  value: number | null; // null = auto (fit content)
}

export const ASPECT_RATIOS: AspectRatioPreset[] = [
  { name: "Auto", value: null },
  { name: "16:9", value: 16 / 9 },
  { name: "4:3", value: 4 / 3 },
  { name: "1:1", value: 1 },
  { name: "9:16", value: 9 / 16 },
];

export interface ProAspectRatioPreset {
  name: string;
  label: string;
  width: number;
  height: number;
}

export const PRO_ASPECT_RATIOS: Record<string, ProAspectRatioPreset[]> = {
  Standard: [
    { name: "16:9", label: "16:9", width: 16, height: 9 },
    { name: "3:2", label: "3:2", width: 3, height: 2 },
    { name: "4:3", label: "4:3", width: 4, height: 3 },
    { name: "5:4", label: "5:4", width: 5, height: 4 },
    { name: "1:1", label: "1:1", width: 1, height: 1 },
    { name: "4:5", label: "4:5", width: 4, height: 5 },
    { name: "3:4", label: "3:4", width: 3, height: 4 },
    { name: "2:3", label: "2:3", width: 2, height: 3 },
    { name: "9:16", label: "9:16", width: 9, height: 16 },
  ],
  Instagram: [
    { name: "Post", label: "1:1", width: 1080, height: 1080 },
    { name: "Portrait", label: "4:5", width: 1080, height: 1350 },
    { name: "Story", label: "9:16", width: 1080, height: 1920 },
  ],
  Twitter: [
    { name: "Tweet", label: "16:9", width: 1600, height: 900 },
    { name: "Cover", label: "3:1", width: 1500, height: 500 },
  ],
  YouTube: [
    { name: "Thumbnail", label: "16:9", width: 1280, height: 720 },
    { name: "Shorts", label: "9:16", width: 1080, height: 1920 },
    { name: "Banner", label: "16:9", width: 2560, height: 1440 },
  ],
  LinkedIn: [
    { name: "Post", label: "1:1", width: 1200, height: 1200 },
    { name: "Cover", label: "4:1", width: 1128, height: 191 },
  ],
  Facebook: [
    { name: "Post", label: "1.91:1", width: 1200, height: 630 },
    { name: "Cover", label: "16:9", width: 820, height: 312 },
  ],
  OpenGraph: [
    { name: "OG Image", label: "1.91:1", width: 1200, height: 630 },
  ],
};

/* ─── mesh gradient presets ─── */

export interface MeshGradientPreset {
  name: string;
  /** path relative to /public */
  src: string;
  description?: string;
}

export const MESH_GRADIENT_PRESETS: MeshGradientPreset[] = [
  {
    name: "Mesh 1",
    src: "/mesh/mesh-1.webp",
    description: "collected from https://x.com/AlbiaHossain",
  },
  { name: "Mesh 2", src: "/mesh/mesh-98.webp" },
  { name: "Mesh 3", src: "/mesh/mesh-8306.webp" },
  { name: "Mesh 4", src: "/mesh/mesh-8330.webp" },
  { name: "Mesh 5", src: "/mesh/mesh-8337.webp" },
  { name: "Mesh 6", src: "/mesh/mesh-8486.webp" },
  { name: "Mesh 7", src: "/mesh/mesh-8673.webp" },
];

/* ─── solid color presets ─── */

export const SOLID_COLOR_PRESETS = [
  "#ffffff",
  "#f8fafc",
  "#f1f5f9",
  "#e2e8f0",
  "#1e293b",
  "#0f172a",
  "#020617",
  "#000000",
  "#fef2f2",
  "#fff7ed",
  "#fefce8",
  "#f0fdf4",
  "#ecfeff",
  "#eff6ff",
  "#f5f3ff",
  "#fdf2f8",
];
