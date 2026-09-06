/** A clip's thumbnail image; objectPosition mirrors the full-page canvas crop. */
export type ClipThumb = {
  src: string;
  objectPosition?: string;
};

export type ClipDragMode = "move" | "trim" | "trim-start";

/** A single animation timeline row (main screenshot or slot). */
export type TimelineLayer = {
  id: string;
  label: string;
  kind: "main" | "slot";
  src: string | null;
  objectPosition?: string;
};
