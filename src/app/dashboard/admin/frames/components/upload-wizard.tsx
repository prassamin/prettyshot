"use client";

import { useFrameCreator } from "./frame-creator/use-frame-creator";
import { IdentitySection } from "./frame-creator/identity-section";
import { CategorySection } from "./frame-creator/category-section";
import { PropertiesSection } from "./frame-creator/properties-section";
import { GeometrySection } from "./frame-creator/geometry-section";
import { VariantsSection } from "./frame-creator/variants-section";
import { UploadFooter } from "./frame-creator/upload-footer";
import type { FrameCreatorProps } from "./frame-creator/types";

export function FrameCreator({
  categories,
  onUploaded,
  editing,
}: FrameCreatorProps) {
  const ctx = useFrameCreator(editing, categories);

  const handleClear = () => ctx.clearForm(onUploaded);
  const handleDone = () => ctx.clearForm(onUploaded);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface-muted/50 shadow-[0_8px_40px_color-mix(in_oklab,var(--overlay)_30%,transparent)]">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-24 right-0 size-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-primary/10 blur-3xl" />

      <IdentitySection ctx={ctx} />

      <div className="relative grid gap-6 p-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-5">
          <CategorySection ctx={ctx} />
          <PropertiesSection ctx={ctx} />
          <GeometrySection ctx={ctx} />
        </div>
        <VariantsSection ctx={ctx} />
      </div>

      <UploadFooter
        ctx={ctx}
        onUpload={onUploaded}
        onDone={handleDone}
        onReset={handleClear}
      />
    </div>
  );
}