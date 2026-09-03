/**
 * Screenshot folder — consolidated type definitions.
 *
 * Single home for every type the screenshot domain consumes that is *defined
 * outside* this folder. The definitions live here; the original modules
 * import them back and re-export them so their other consumers keep
 * working.
 *
 * Keep this file in sync with the modules below — when the definition of a
 * type changes, change it here and NOT in the old location.
 */

/** Layer visibility metadata for the screenshot element. */
export type ScreenshotLayer = {
  zIndex: number;
  opacity: number;
  hidden: boolean;
};

/** Editor toolbar tool ids. */
export type EditorToolBarTool =
  "pointer" | "text" | "draw" | "position" | "layers";

/** Measured stage + image dimensions used for placement math. */
export type PlacementDims = {
  stageW: number;
  stageH: number;
  imgW: number;
  imgH: number;
};

/** Free-placement geometry of a frame-less shot (pixels). */
export type BareFreePlacement = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Which center guide lines are currently active. */
export type CenterGuidesState = { x: boolean; y: boolean };
