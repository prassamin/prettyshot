"use client";

import { Check, ChevronDown, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { FrameDropzone } from "../frame-dropzone";
import type { FrameCreatorState } from "./use-frame-creator";

export function CategorySection({ ctx }: { ctx: FrameCreatorState }) {
  const {
    categories,
    categoryId,
    setCategoryId,
    isNewCategory,
    setIsNewCategory,
    categoryIcon,
    setCategoryIcon,
    isEditing,
    editing,
  } = ctx;

  return (
    <div className="rounded-2xl border border-border/40 bg-background p-4 shadow-inner flex flex-col">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground">
          Category
        </span>
        {isEditing ? (
          <span className="rounded-full border border-border/50 bg-background/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {editing!.categoryId}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setIsNewCategory((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            {isNewCategory ? "Pick existing" : "New category"}
            <ChevronDown
              className={cn(
                "size-3 transition-transform",
                isNewCategory && "rotate-180",
              )}
            />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-2.5 py-2">
          <FolderKanban className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-[12px] font-medium text-foreground">
            {categories.find((c) => c.id === editing!.categoryId)?.label ??
              editing!.categoryId}
          </span>
        </div>
      ) : isNewCategory ? (
        <div className="mt-3 space-y-2.5">
          <input
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            placeholder="e.g. iPhone, Android, Desktop"
            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none"
          />
          <FrameDropzone
            label="Category icon (optional)"
            hint="Upload icon.svg"
            file={categoryIcon}
            onFileChange={setCategoryIcon}
            accept="image/svg+xml,image/png,image/webp"
            aspect="aspect-[16/5]"
            compact
          />
        </div>
      ) : (
        <div className="mt-3 max-h-52 space-y-1 overflow-y-auto pr-1">
          {categories.length === 0 ? (
            <p className="py-4 text-center text-[11px] text-muted-foreground">
              No categories — create a new one
            </p>
          ) : (
            categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all",
                  categoryId === c.id
                    ? "border-primary/40 bg-primary/10"
                    : "border-transparent hover:bg-muted/30",
                )}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted/40">
                  {c.iconUrl ? (
                    <img src={c.iconUrl} alt="" className="size-4" />
                  ) : (
                    <FolderKanban className="size-3.5 text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-medium text-foreground">
                    {c.label}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">
                    {c.frames.length} frames
                  </span>
                </span>
                {categoryId === c.id && (
                  <Check className="size-3.5 shrink-0 text-primary" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
