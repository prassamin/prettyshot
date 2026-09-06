"use client";

import type { FrameCreatorState } from "./use-frame-creator";

export function IdentitySection({ ctx }: { ctx: FrameCreatorState }) {
  const {
    frameName,
    handleNameChange,
    frameId,
    handleIdChange,
    isEditing,
    editing,
  } = ctx;

  return (
    <div className="relative border-b border-border/50 px-6 pt-6 pb-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {isEditing ? "Edit frame" : "Frame identity"}
            </label>
            {isEditing && (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                Editing {editing!.frame.id}
              </span>
            )}
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 max-w-2xl">
            <input
              value={frameName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Display name — e.g. iPhone 17"
              className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
            <input
              value={frameId}
              onChange={(e) => handleIdChange(e.target.value)}
              placeholder="Frame ID — e.g. iphone-17"
              className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}