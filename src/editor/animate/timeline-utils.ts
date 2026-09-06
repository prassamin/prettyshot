import type { AnimationClip } from "@/editor/lib/animation/types";
import type { ClipThumb, TimelineLayer } from "./types";

/** Map a timeline layer id to the animation target scope it edits. */
function layerScopeFor(layerId: string): "main" | "slot" {
  return layerId === "main" ? "main" : "slot";
}

/** The clips that render on a given layer row. */
export function clipsForScope(
  clips: AnimationClip[],
  layerId: string,
): AnimationClip[] {
  const scope = layerScopeFor(layerId);
  return clips.filter((clip) =>
    scope === "slot"
      ? clip.target?.scope === "slot" && clip.target.slotId === layerId
      : clip.target?.scope === "all" || clip.target?.scope === "main",
  );
}

/** Thumbnails shown inside a clip block: the target screenshot(s), or the
 * main image plus every slot image for an "all" clip. */
export function thumbnailsFor(
  clip: AnimationClip,
  layers: TimelineLayer[],
  mainThumb: ClipThumb | null,
): ClipThumb[] {
  const target = clip.target ?? { scope: "all" as const };
  if (target.scope === "slot") {
    const slot = layers.find((l) => l.id === target.slotId);
    if (slot?.src) {
      return [{ src: slot.src, objectPosition: "center" }];
    }
    return mainThumb ? [mainThumb] : [];
  }
  if (target.scope === "main") {
    return mainThumb ? [mainThumb] : [];
  }
  const thumbs: ClipThumb[] = [];
  if (mainThumb) thumbs.push(mainThumb);
  for (const layer of layers) {
    if (layer.kind !== "slot" || !layer.src) continue;
    thumbs.push({ src: layer.src, objectPosition: "center" });
  }
  return thumbs;
}

/** The effect keys a clip animates, rendered as small glyphs. */
export function effectIconsFor(
  clip: AnimationClip,
): NonNullable<AnimationClip["effects"]> {
  return clip.effects ?? [];
}
