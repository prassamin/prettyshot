"use client";

import type { BackdropAdjustments } from "./types";
import { EffectSlider } from "../../components/effect-slider";
import { EDITOR_LIMITS } from "@/editor/lib/limits";
import { FeatureLock } from "@/editor/components/feature-lock";

interface AdjustmentsControlProps {
  effects: BackdropAdjustments;
  commitEffects: (patch: Partial<BackdropAdjustments>) => void;
  previewEffects: (patch: Partial<BackdropAdjustments>) => void;
}

export function AdjustmentsControl({
  effects,
  commitEffects,
  previewEffects,
}: AdjustmentsControlProps) {
  return (
    <FeatureLock featureId="backdrop.adjustments">
      <div className="space-y-4">
        {/* Group 1: Exposure & Tone */}
        <div className="space-y-2.5">
          <span className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Tone & Exposure
          </span>
          <div className="space-y-2">
            <EffectSlider
              label="Brightness"
              value={effects.brightness}
              onChange={(brightness) => commitEffects({ brightness })}
              onPreview={(brightness) => previewEffects({ brightness })}
              min={EDITOR_LIMITS.brightness.min}
              max={EDITOR_LIMITS.brightness.max}
              step={EDITOR_LIMITS.brightness.step}
              suffix={EDITOR_LIMITS.brightness.suffix}
            />
            <EffectSlider
              label="Contrast"
              value={effects.contrast}
              onChange={(contrast) => commitEffects({ contrast })}
              onPreview={(contrast) => previewEffects({ contrast })}
              min={EDITOR_LIMITS.contrast.min}
              max={EDITOR_LIMITS.contrast.max}
              step={EDITOR_LIMITS.contrast.step}
              suffix={EDITOR_LIMITS.contrast.suffix}
            />
            <EffectSlider
              label="Saturation"
              value={effects.saturation}
              onChange={(saturation) => commitEffects({ saturation })}
              onPreview={(saturation) => previewEffects({ saturation })}
              min={EDITOR_LIMITS.saturation.min}
              max={EDITOR_LIMITS.saturation.max}
              step={EDITOR_LIMITS.saturation.step}
              suffix={EDITOR_LIMITS.saturation.suffix}
            />
            <EffectSlider
              label="Hue Shift"
              value={effects.hue}
              onChange={(hue) => commitEffects({ hue })}
              onPreview={(hue) => previewEffects({ hue })}
              min={EDITOR_LIMITS.hue.min}
              max={EDITOR_LIMITS.hue.max}
              step={EDITOR_LIMITS.hue.step}
              suffix={EDITOR_LIMITS.hue.suffix}
            />
          </div>
        </div>

        {/* Group 2: Color Grading & Style */}
        <div className="space-y-2.5 pt-2">
          <span className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Style & Color
          </span>
          <div className="space-y-2">
            <EffectSlider
              label="Grayscale"
              value={effects.grayscale}
              onChange={(grayscale) => commitEffects({ grayscale })}
              onPreview={(grayscale) => previewEffects({ grayscale })}
              min={EDITOR_LIMITS.grayscale.min}
              max={EDITOR_LIMITS.grayscale.max}
              step={EDITOR_LIMITS.grayscale.step}
              suffix={EDITOR_LIMITS.grayscale.suffix}
            />
            <EffectSlider
              label="Sepia"
              value={effects.sepia}
              onChange={(sepia) => commitEffects({ sepia })}
              onPreview={(sepia) => previewEffects({ sepia })}
              min={EDITOR_LIMITS.sepia.min}
              max={EDITOR_LIMITS.sepia.max}
              step={EDITOR_LIMITS.sepia.step}
              suffix={EDITOR_LIMITS.sepia.suffix}
            />
            <EffectSlider
              label="Invert"
              value={effects.invert}
              onChange={(invert) => commitEffects({ invert })}
              onPreview={(invert) => previewEffects({ invert })}
              min={EDITOR_LIMITS.invert.min}
              max={EDITOR_LIMITS.invert.max}
              step={EDITOR_LIMITS.invert.step}
              suffix={EDITOR_LIMITS.invert.suffix}
            />
          </div>
        </div>

        {/* Group 3: Texture & Grain */}
        <div className="space-y-2.5 pt-2">
          <span className="block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Texture & Focus
          </span>
          <div className="space-y-2">
            <EffectSlider
              label="Blur Radius"
              value={effects.blur}
              onChange={(blur) => commitEffects({ blur })}
              onPreview={(blur) => previewEffects({ blur })}
              min={EDITOR_LIMITS.blur.min}
              max={EDITOR_LIMITS.blur.max}
              step={EDITOR_LIMITS.blur.step}
              suffix={EDITOR_LIMITS.blur.suffix}
            />
            <EffectSlider
              label="Noise Grain"
              value={effects.noise}
              onChange={(noise) => commitEffects({ noise })}
              onPreview={(noise) => previewEffects({ noise })}
              min={EDITOR_LIMITS.noise.min}
              max={EDITOR_LIMITS.noise.max}
              step={EDITOR_LIMITS.noise.step}
              suffix={EDITOR_LIMITS.noise.suffix}
            />
            <EffectSlider
              label="Backdrop Opacity"
              value={effects.opacity}
              onChange={(opacity) => commitEffects({ opacity })}
              onPreview={(opacity) => previewEffects({ opacity })}
              min={EDITOR_LIMITS.opacity.min}
              max={EDITOR_LIMITS.opacity.max}
              step={EDITOR_LIMITS.opacity.step}
              suffix={EDITOR_LIMITS.opacity.suffix}
            />
          </div>
        </div>
      </div>
    </FeatureLock>
  );
}
