type BlobConfig = { x: number; y: number; spread: number; tone: string };

type BeamConfig = { start: number; span: number; angle: number; tone: string };

let svgCounter = 0;

function toDataUri(svg: string): string {
  const base64 = typeof window !== "undefined"
    ? btoa(svg.trim())
    : Buffer.from(svg.trim()).toString("base64");
  return `url("data:image/svg+xml;base64,${base64}")`;
}

function buildMeshComposite(backdrop: string, blobs: BlobConfig[]): string {
  const p = `pm${svgCounter++}`;
  const gradients = blobs
    .map(
      (b, i) =>
        `<radialGradient id='${p}-${i}' cx='${b.x}%' cy='${b.y}%' r='${b.spread}%'><stop offset='0%' stop-color='${b.tone}' stop-opacity='0.85'/><stop offset='100%' stop-color='${b.tone}' stop-opacity='0'/></radialGradient>`,
    )
    .join("");
  const shapes = blobs
    .map((_, i) => `<rect width='100%' height='100%' fill='url(#${p}-${i})'/>`)
    .join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' preserveAspectRatio='xMidYMid slice'><defs>${gradients}</defs><rect width='100%' height='100%' fill='${backdrop}'/>${shapes}</svg>`;
  return `${toDataUri(svg)} center / cover no-repeat`;
}

function buildAuroraEffect(backdrop: string, beams: BeamConfig[]): string {
  const p = `pa${svgCounter++}`;
  const gradients = beams
    .map(
      (b, i) =>
        `<linearGradient id='${p}-${i}' x1='0' y1='0' x2='1' y2='0'><stop offset='0%' stop-color='${b.tone}' stop-opacity='0'/><stop offset='50%' stop-color='${b.tone}' stop-opacity='0.7'/><stop offset='100%' stop-color='${b.tone}' stop-opacity='0'/></linearGradient>`,
    )
    .join("");
  const strips = beams
    .map(
      (b, i) =>
        `<rect x='-25%' y='${b.start}%' width='150%' height='${b.span}%' fill='url(#${p}-${i})' transform='rotate(${b.angle} 200 150)'/>`,
    )
    .join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' preserveAspectRatio='xMidYMid slice'><defs>${gradients}<filter id='${p}-glow' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='16'/></filter></defs><rect width='100%' height='100%' fill='${backdrop}'/><g filter='url(#${p}-glow)'>${strips}</g></svg>`;
  return `${toDataUri(svg)} center / cover no-repeat`;
}

export const MESH_GRADIENT_PRESETS = [
  buildMeshComposite("#1a0c08", [
    { x: 25, y: 30, spread: 58, tone: "#f97316" },
    { x: 70, y: 65, spread: 52, tone: "#fbbf24" },
    { x: 45, y: 85, spread: 48, tone: "#ef4444" },
  ]),
  buildMeshComposite("#0a1210", [
    { x: 30, y: 25, spread: 55, tone: "#34d399" },
    { x: 75, y: 70, spread: 50, tone: "#2dd4bf" },
    { x: 50, y: 45, spread: 42, tone: "#a3e635" },
  ]),
  buildMeshComposite("#12081a", [
    { x: 20, y: 80, spread: 56, tone: "#f472b6" },
    { x: 80, y: 15, spread: 52, tone: "#e879f9" },
    { x: 60, y: 50, spread: 46, tone: "#c084fc" },
  ]),
  buildMeshComposite("#08101a", [
    { x: 22, y: 35, spread: 54, tone: "#60a5fa" },
    { x: 78, y: 60, spread: 50, tone: "#38bdf8" },
    { x: 40, y: 80, spread: 44, tone: "#7dd3fc" },
  ]),
  buildMeshComposite("#1a1008", [
    { x: 28, y: 20, spread: 52, tone: "#fbbf24" },
    { x: 72, y: 75, spread: 48, tone: "#f97316" },
    { x: 50, y: 50, spread: 40, tone: "#fcd34d" },
  ]),
  buildMeshComposite("#0d0d1a", [
    { x: 35, y: 25, spread: 50, tone: "#818cf8" },
    { x: 70, y: 70, spread: 46, tone: "#a78bfa" },
    { x: 25, y: 75, spread: 44, tone: "#93c5fd" },
  ]),
  buildMeshComposite("#0a1a12", [
    { x: 28, y: 60, spread: 52, tone: "#4ade80" },
    { x: 75, y: 25, spread: 48, tone: "#22d3ee" },
    { x: 55, y: 90, spread: 42, tone: "#86efac" },
  ]),
  buildMeshComposite("#1a0a15", [
    { x: 22, y: 20, spread: 50, tone: "#fb7185" },
    { x: 80, y: 80, spread: 46, tone: "#f43f5e" },
    { x: 50, y: 55, spread: 38, tone: "#fda4af" },
  ]),
  buildMeshComposite("#0a0a1a", [
    { x: 25, y: 35, spread: 48, tone: "#6366f1" },
    { x: 75, y: 25, spread: 44, tone: "#818cf8" },
    { x: 50, y: 80, spread: 42, tone: "#a5b4fc" },
  ]),
  buildMeshComposite("#1a1208", [
    { x: 30, y: 70, spread: 52, tone: "#d97706" },
    { x: 70, y: 30, spread: 48, tone: "#b45309" },
    { x: 50, y: 50, spread: 36, tone: "#f59e0b" },
  ]),
  buildMeshComposite("#0a1a18", [
    { x: 20, y: 25, spread: 50, tone: "#14b8a6" },
    { x: 80, y: 75, spread: 46, tone: "#5eead4" },
    { x: 45, y: 55, spread: 40, tone: "#99f6e4" },
    { x: 70, y: 30, spread: 38, tone: "#2dd4bf" },
  ]),
];

export const AURORA_GRADIENT_PRESETS = [
  buildAuroraEffect("#1a0f08", [
    { start: 15, span: 18, angle: -12, tone: "#f97316" },
    { start: 40, span: 20, angle: -12, tone: "#fbbf24" },
    { start: 65, span: 16, angle: -12, tone: "#ef4444" },
  ]),
  buildAuroraEffect("#081a12", [
    { start: 18, span: 20, angle: 10, tone: "#34d399" },
    { start: 45, span: 22, angle: 10, tone: "#22d3ee" },
  ]),
  buildAuroraEffect("#1a0815", [
    { start: 20, span: 16, angle: -8, tone: "#f472b6" },
    { start: 45, span: 18, angle: -8, tone: "#e879f9" },
    { start: 68, span: 14, angle: -8, tone: "#c084fc" },
  ]),
  buildAuroraEffect("#080f1a", [
    { start: 16, span: 14, angle: 15, tone: "#60a5fa" },
    { start: 40, span: 16, angle: 15, tone: "#38bdf8" },
    { start: 62, span: 18, angle: 15, tone: "#7dd3fc" },
  ]),
  buildAuroraEffect("#1a1508", [
    { start: 22, span: 22, angle: -20, tone: "#fbbf24" },
    { start: 52, span: 20, angle: -20, tone: "#f97316" },
  ]),
  buildAuroraEffect("#0a0a1a", [
    { start: 14, span: 12, angle: -10, tone: "#818cf8" },
    { start: 36, span: 14, angle: -10, tone: "#a78bfa" },
    { start: 58, span: 16, angle: -10, tone: "#93c5fd" },
  ]),
  buildAuroraEffect("#0a1a14", [
    { start: 20, span: 18, angle: 12, tone: "#4ade80" },
    { start: 44, span: 20, angle: 12, tone: "#22d3ee" },
    { start: 68, span: 16, angle: 12, tone: "#86efac" },
  ]),
  buildAuroraEffect("#1a0a14", [
    { start: 16, span: 14, angle: -14, tone: "#fb7185" },
    { start: 40, span: 16, angle: -14, tone: "#f43f5e" },
    { start: 62, span: 18, angle: -14, tone: "#fda4af" },
  ]),
  buildAuroraEffect("#0a0a18", [
    { start: 12, span: 10, angle: -28, tone: "#6366f1" },
    { start: 32, span: 12, angle: -28, tone: "#818cf8" },
    { start: 52, span: 14, angle: -28, tone: "#a5b4fc" },
  ]),
];

export const GRADIENT_PRESETS: string[] = [
  "linear-gradient(135deg, #16a34a, #4ade80)",
  "linear-gradient(140deg, #6d28d9, #3b82f6)",
  "linear-gradient(155deg, #b91c1c, #f97316)",
  "linear-gradient(145deg, #0e7490, #818cf8)",
  "linear-gradient(135deg, #c026d3, #f43f5e)",
  "linear-gradient(150deg, #0f766e, #22d3ee)",
  "linear-gradient(135deg, #4338ca, #8b5cf6)",
  "linear-gradient(160deg, #c2410c, #eab308)",
  "linear-gradient(140deg, #0369a1, #38bdf8)",
  "linear-gradient(155deg, #9d174d, #d946ef)",
  "linear-gradient(135deg, #166534, #86efac)",
  "linear-gradient(145deg, #7e22ce, #d8b4fe)",
  "linear-gradient(135deg, #991b1b, #fb923c)",
  "linear-gradient(150deg, #155e75, #67e8f9)",
  "linear-gradient(140deg, #5b21b6, #c4b5fd)",
  "linear-gradient(135deg, #9a3412, #fcd34d)",

  "linear-gradient(135deg, #e11d48, #fde047)",
  "linear-gradient(145deg, #be123c, #fb923c)",
  "linear-gradient(140deg, #991b1b, #f59e0b)",
  "linear-gradient(155deg, #881337, #f97316)",
  "linear-gradient(135deg, #be123c, #fde047, #f472b6)",
  "linear-gradient(150deg, #e11d48, #fb7185)",
  "linear-gradient(140deg, #991b1b, #dc2626)",
  "linear-gradient(135deg, #881337, #f59e0b)",
  "linear-gradient(155deg, #be123c, #fcd34d)",
  "linear-gradient(145deg, #e11d48, #f97316)",
  "linear-gradient(135deg, #881337, #fb923c, #f472b6)",
  "linear-gradient(140deg, #991b1b, #fde047)",

  "linear-gradient(135deg, #1d4ed8, #8b5cf6)",
  "linear-gradient(145deg, #0e7490, #6366f1)",
  "linear-gradient(150deg, #0f766e, #2563eb)",
  "linear-gradient(135deg, #0369a1, #7c3aed)",
  "linear-gradient(140deg, #155e75, #4f46e5)",
  "linear-gradient(155deg, #1d4ed8, #c4b5fd)",
  "linear-gradient(135deg, #075985, #6366f1)",
  "linear-gradient(145deg, #0e7490, #8b5cf6)",
  "linear-gradient(150deg, #0f766e, #818cf8)",
  "linear-gradient(135deg, #0369a1, #c4b5fd)",
  "linear-gradient(140deg, #1d4ed8, #d8b4fe)",
  "linear-gradient(155deg, #075985, #8b5cf6)",

  "linear-gradient(135deg, #d946ef, #7c3aed)",
  "linear-gradient(145deg, #f472b6, #d8b4fe)",
  "linear-gradient(150deg, #fb7185, #c4b5fd)",
  "linear-gradient(135deg, #ec4899, #6366f1)",
  "linear-gradient(140deg, #c026d3, #818cf8)",
  "linear-gradient(155deg, #f472b6, #8b5cf6)",
  "linear-gradient(135deg, #d946ef, #a855f7)",
  "linear-gradient(145deg, #fb7185, #d8b4fe)",
  "linear-gradient(150deg, #f472b6, #6366f1)",
  "linear-gradient(135deg, #ec4899, #7c3aed)",
  "linear-gradient(140deg, #c026d3, #c4b5fd)",
  "linear-gradient(155deg, #d946ef, #8b5cf6)",

  "linear-gradient(135deg, #1c1917, #44403c)",
  "linear-gradient(145deg, #0c0a09, #292524)",
  "linear-gradient(150deg, #1c1917, #57534e)",
  "linear-gradient(135deg, #0a0a0a, #52525b)",
  "linear-gradient(140deg, #18181b, #71717a)",
  "linear-gradient(155deg, #0c0a09, #44403c)",
  "linear-gradient(135deg, #1c1917, #78716c)",
  "linear-gradient(145deg, #0a0a0a, #3f3f46)",
  "linear-gradient(150deg, #18181b, #52525b)",
  "linear-gradient(135deg, #0c0a09, #71717a)",

  "linear-gradient(135deg, #d8b4fe, #fecdd3)",
  "linear-gradient(145deg, #a5b4fc, #fecaca)",
  "linear-gradient(150deg, #93c5fd, #fde68a)",
  "linear-gradient(135deg, #86efac, #a5f3fc)",
  "linear-gradient(140deg, #fecdd3, #c7d2fe)",
  "linear-gradient(155deg, #a5f3fc, #e9d5ff)",
  "linear-gradient(135deg, #fde68a, #fecdd3)",
  "linear-gradient(145deg, #c7d2fe, #fecaca)",
  "linear-gradient(150deg, #a5f3fc, #fde68a)",
  "linear-gradient(135deg, #e9d5ff, #a5f3fc)",

  ...MESH_GRADIENT_PRESETS,
  ...AURORA_GRADIENT_PRESETS,
];

export const SOLID_PRESETS = [
  "#1c1917",
  "#ffffff",
  "#dc2626",
  "#eab308",
  "#16a34a",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#0d9488",
  "#4f46e5",
  "#0891b2",
  "#65a30d",
  "#be123c",
  "#0e7490",
];

export const AUTO_PLACEHOLDER_GRADIENT =
  "linear-gradient(135deg, #27272a, #52525b)";
