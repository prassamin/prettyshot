/**
 * Feature gating registry — the single source of truth for which features are
 * free vs paid (one-time Pro).
 *
 * To flip a feature's tier, edit ONLY the value in `FEATURES` below — no
 * component code needs to change. Components read this registry through the
 * `useFeatureGate` hook (or `getFeatureGate` for non-hook contexts).
 *
 * Feature IDs are typed (`FeatureId`), so adding a feature = adding one id to
 * the union + one entry in `FEATURES`. Everything downstream (lock UI, export
 * gates, server checks) picks it up automatically.
 */

export type FeatureTier = "free" | "pro";

/**
 * Every gateable feature in the product. Keep ids grouped by domain:
 *   core.*       — canvas + styling essentials
 *   frames.*     — device frames
 *   backgrounds.*— backgrounds
 *   backdrop.*   — backdrop adjustments / overlays
 *   elements.*   — annotations, slots, text
 *   export.*     — formats, resolutions, video
 *   animate.*    — animation
 *   cloud.*      — sync / autosave
 *   brand.*      — watermark
 */
export type FeatureId =
  // ── Core canvas ────────────────────────────────────────────────
  | "core.multiSlot" // 2nd/3rd screenshot boxes (slots)

  // ── Aspect ratio ───────────────────────────────────────────────
  | "aspect.presets" // twitter/instagram/linkedin/social sets
  | "aspect.basic" // auto, 16:9, 1:1, 9:16, 4:3
  | "aspect.custom" // custom aspect ratio

  // ── Frames ────────────────────────────────────────────────────
  | "frames.hardcoded" // the hardcoded frames

  // ── Backgrounds ────────────────────────────────────────────────
  | "backgrounds" // the whole backgrounds section (solid/gradient/mesh/aurora/image/auto presets)
  | "backgrounds.colorpicker" // the color picker
  | "backgrounds.noise" // the upload control
  | "backgrounds.upload" // the custom image upload control

  // ── Backdrop / overlays ────────────────────────────────────────
  | "backdrop.shadow"
  | "backdrop.lighting"
  | "backdrop.adjustments"
  | "backdrop.filters" // gradient overlays, patterns

  // ── Transformations ───────────────────────────────────────────
  | "transform.tilt"
  | "transform.layout"

  // ── Shadows ───────────────────────────────────────────────────
  | "shadow"

  // ── Borders ───────────────────────────────────────────────────
  | "border"

  // ── Elements ───────────────────────────────────────────────────
  | "elements.annotations" // draw, shapes
  | "elements.text" // text tool
  | "elements.assets" // image assets

  // ── Export ─────────────────────────────────────────────────────
  | "export.png" // PNG
  | "export.jpeg" // JPEG
  | "export.webp" // WebP
  | "export.hd" // 1080p (1x)
  | "export.4k" // 2160p (2x)
  | "export.8k" // 4320p (4x)
  | "export.video" // MP4 / WebM animation export

  // ── Animation ──────────────────────────────────────────────────
  | "animate" // animate mode (keyframes / timeline)

  // ── Cloud / brand ──────────────────────────────────────────────
  | "cloud.sync" // cloud autosave + designs across devices
  | "brand.watermark"; // remove PrettyShot watermark from exports

/**
 * The tier of every feature. THIS is the array you edit to make a feature
 * free or paid. When `DISABLE_PAID` is on, `isPro` returns active for
 * everyone, so every "pro" feature is effectively unlocked — the registry
 * itself is untouched by that flag (the gate layer handles it).
 */
export const FEATURES: Record<FeatureId, FeatureTier> = {
  // Core canvas — the product's essence stays free
  "core.multiSlot": "pro",

  // Aspect
  "aspect.basic": "free",
  "aspect.presets": "pro",
  "aspect.custom": "pro",

  // Frames
  "frames.hardcoded": "free",

  // Backgrounds — the whole section is one feature; per-asset free/paid is
  // decided by the DB `is_free` flag, not here.
  backgrounds: "free",
  "backgrounds.colorpicker": "pro",
  "backgrounds.noise": "free",
  "backgrounds.upload": "pro",

  // Backdrop
  "backdrop.shadow": "pro",
  "backdrop.lighting": "pro",
  "backdrop.adjustments": "pro",
  "backdrop.filters": "pro",

  // Transformations
  "transform.tilt": "pro",
  "transform.layout": "pro",

  // Shadows
  shadow: "pro",

  // Borders
  border: "pro",

  // Elements
  "elements.annotations": "pro",
  "elements.text": "pro",
  "elements.assets": "pro",

  // Animation
  animate: "pro",

  // Export
  "export.png": "free",
  "export.jpeg": "pro",
  "export.webp": "pro",
  "export.hd": "free",
  "export.4k": "pro",
  "export.8k": "pro",
  "export.video": "pro",

  // Cloud / brand
  "cloud.sync": "pro",
  "brand.watermark": "pro",
};

/**
 * Human-readable description for every feature id. Shown when the
 * user hovers a locked area (see FeatureLock).
 */
export const FEATURE_DESCRIPTIONS: Record<FeatureId, string | null> = {
  // Core canvas
  "core.multiSlot": "Add multiple screenshot boxes to one canvas.",

  // Aspect
  "aspect.basic": null,
  "aspect.presets":
    "Social platform presets — Twitter, Instagram, LinkedIn and more.",
  "aspect.custom": "Set any custom aspect ratio for your canvas.",

  // Frames
  "frames.hardcoded": null,

  // Backgrounds
  backgrounds: null,
  "backgrounds.colorpicker": "Pick any custom color for your background.",
  "backgrounds.noise": null,
  "backgrounds.upload": "Upload your own background images from this device.",

  // Backdrop
  "backdrop.shadow": null,
  "backdrop.lighting": null,
  "backdrop.adjustments": null,
  "backdrop.filters": null,

  // Transformations
  "transform.tilt": null,
  "transform.layout": null,

  // Shadow
  shadow: null,

  // Borders
  border: null,

  // Elements
  "elements.annotations": null,
  "elements.text": null,
  "elements.assets": "Add your own image assets to the canvas.",

  // Export
  "export.png": null,
  "export.jpeg": "Export your design as a JPEG image.",
  "export.webp": "Export your design as a WebP image.",
  "export.hd": null,
  "export.4k": "Export at 4K (2160p) resolution.",
  "export.8k": "Export at 8K (4320p) resolution.",
  "export.video": "Export your animation as MP4 or WebM video.",

  // Animation
  animate: null,

  // Cloud / brand
  "cloud.sync": "Cloud sync — your designs follow you across devices.",
  "brand.watermark": "Remove the PrettyShot watermark from your exports.",
};

/* ──────────────────────────────────────────────────────────────────────────
 * Static marketing lists for the pricing page.
 *
 * Edit these freely — they are plain copy, decoupled from the gating
 * registry above (which is what actually locks features in the editor).
 * ──────────────────────────────────────────────────────────────────────── */

export const FREE_FEATURES: string[] = [
  "PNG exports up to 1080p HD",
  "Safari & Chrome browser frames",
  "Solid, mesh & aurora backgrounds",
  "Auto palettes from your screenshot",
  "Annotations, text & shapes",
  "Standard aspect ratios",
  "Free Pro trial, no card required",
];

export const PRO_FEATURES: string[] = [
  "Everything in Free, plus:",
  "PNG, JPEG & WebP up to 8K",
  "Premium iPhone, MacBook & iPad frames",
  "3D tilt, lighting, grain & borders",
  "Social presets + custom ratios",
  "Animation timeline + video export",
  "Cloud sync across devices",
  "No watermark on exports",
];
