"use client";

import * as React from "react";
import {
  DndContext,
  type DragEndEvent,
  type Modifier,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { ProgressiveImage } from "@/components/progressive-image";
import { backgroundCss, useEditor } from "@/editor/lib/engine";
import type { DeviceFrame } from "@/editor/frames/types";
import { BROWSER_FRAMES } from "@/editor/frames/catalog";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeClosed,
  GripVertical,
  ImageIcon,
  Images,
  LineSquiggle,
  Lock,
  MonitorSmartphone,
  Trash,
  Type,
} from "lucide-react";
import { lookupDynamicDeviceFrameModel } from "@/editor/frames/dynamic-catalog";

type StackEntryKind = "screenshot" | "slot" | "asset" | "text" | "annotation";

type StackEntry = {
  uid: string;
  id: string;
  kind: StackEntryKind;
  origin?: "annotation-shape" | "annotation-stroke";
  label: string;
  subtitle: string;
  depth: number;
  concealed: boolean;
  seeThrough: number;
  preview?: string;
};
const ANNOTATION_SHAPE_LABELS: Record<string, string> = {
  rect: "Rectangle",
  ellipse: "Ellipse",
};

const STROKE_LABELS: Record<string, string> = {
  highlight: "Highlighter",
};

function labelForShape(kind: string) {
  return ANNOTATION_SHAPE_LABELS[kind] ?? "Arrow";
}

function labelForStroke(mode: string) {
  return STROKE_LABELS[mode] ?? "Pen stroke";
}

function buildStack(editor: ReturnType<typeof useEditor>): StackEntry[] {
  const acc: StackEntry[] = [];
  const {
    screenshot,
    screenshotLayer,
    slots,
    assets,
    texts,
    annotations,
    annotationShapes,
    deviceFrame,
  } = editor;

  if (screenshot) {
    acc.push({
      uid: "screenshot:main",
      id: "main",
      kind: "screenshot",
      label: "Screenshot",
      subtitle: "Image",
      depth: screenshotLayer.zIndex,
      concealed: screenshotLayer.hidden,
      seeThrough: screenshotLayer.opacity,
      preview: screenshot,
    });
  }

  for (const asset of assets) {
    acc.push({
      uid: `asset:${asset.id}`,
      id: asset.id,
      kind: "asset",
      label: "Image layer",
      subtitle: "Image",
      depth: asset.zIndex,
      concealed: Boolean(asset.hidden),
      seeThrough: asset.opacity,
      preview: asset.src,
    });
  }

  for (const [i, slot] of slots.entries()) {
    acc.push({
      uid: `slot:${slot.id}`,
      id: slot.id,
      kind: "slot",
      label: `Screenshot box ${i + 1}`,
      subtitle:
        deviceFrame.id === "none"
          ? "Screenshot box"
          : `Frame · ${deviceFrame.id.replace(/_/g, " ")}`,
      depth: slot.zIndex,
      concealed: Boolean(slot.hidden),
      seeThrough: screenshotLayer.opacity,
      preview: slot.src ?? undefined,
    });
  }

  for (const text of texts) {
    const trimmed = text.content.replace(/\s+/g, " ").trim();
    acc.push({
      uid: `text:${text.id}`,
      id: text.id,
      kind: "text",
      label: trimmed || "Text layer",
      subtitle: "Text",
      depth: text.zIndex,
      concealed: Boolean(text.hidden),
      seeThrough: text.opacity ?? 100,
    });
  }

  for (const [i, stroke] of annotations.entries()) {
    if (stroke.mode === "eraser") continue;
    acc.push({
      uid: `annotation-stroke:${stroke.id}`,
      id: stroke.id,
      kind: "annotation",
      origin: "annotation-stroke",
      label: labelForStroke(stroke.mode),
      subtitle: "Annotation",
      depth: stroke.zIndex ?? i + 1,
      concealed: Boolean(stroke.hidden),
      seeThrough: stroke.opacity ?? 100,
    });
  }

  for (const shape of annotationShapes) {
    acc.push({
      uid: `annotation:${shape.id}`,
      id: shape.id,
      kind: "annotation",
      origin: "annotation-shape",
      label: labelForShape(shape.kind),
      subtitle: "Annotation",
      depth: shape.zIndex,
      concealed: Boolean(shape.hidden),
      seeThrough: shape.opacity ?? 100,
    });
  }

  return acc.sort((a, b) => b.depth - a.depth);
}

function useLayerStack() {
  const editor = useEditor();
  const [pickedUid, setPickedUid] = React.useState<string | null>(null);
  const entries = React.useMemo(
    () => buildStack(editor),
    [
      editor.assets,
      editor.annotations,
      editor.annotationShapes,
      editor.deviceFrame.id,
      editor.screenshot,
      editor.screenshotLayer,
      editor.slots,
      editor.texts,
    ],
  );

  const {
    selectedAssetId,
    setSelectedAssetId,
    selectedTextId,
    setSelectedTextId,
    selectedAnnotationShapeId,
    setSelectedAnnotationShapeId,
    selectedSlotId,
    setSelectedSlotId,
    isScreenshotSelected,
    setIsScreenshotSelected,
    setActiveTool,
    updateSlot,
    deleteSlot,
    updateScreenshotLayer,
    updateAsset,
    deleteAsset,
    updateText,
    deleteText,
    updateAnnotationStrokeLayer,
    deleteAnnotationStroke,
    updateAnnotationShape,
    deleteAnnotationShape,
  } = editor;

  const activeUid =
    pickedUid ??
    (selectedAssetId
      ? `asset:${selectedAssetId}`
      : selectedTextId
        ? `text:${selectedTextId}`
        : selectedAnnotationShapeId
          ? `annotation:${selectedAnnotationShapeId}`
          : selectedSlotId
            ? `slot:${selectedSlotId}`
            : isScreenshotSelected
              ? "screenshot:main"
              : (entries[0]?.uid ?? null));

  const pickEntry = React.useCallback(
    (entry: StackEntry) => {
      setPickedUid(entry.uid);
      setActiveTool("pointer");
      setIsScreenshotSelected(entry.kind === "screenshot");
      setSelectedSlotId(entry.kind === "slot" ? entry.id : null);
      setSelectedAssetId(entry.kind === "asset" ? entry.id : null);
      setSelectedTextId(entry.kind === "text" ? entry.id : null);
      setSelectedAnnotationShapeId(
        entry.origin === "annotation-shape" ? entry.id : null,
      );
    },
    [
      setActiveTool,
      setIsScreenshotSelected,
      setSelectedSlotId,
      setSelectedAssetId,
      setSelectedTextId,
      setSelectedAnnotationShapeId,
    ],
  );

  const patchEntry = React.useCallback(
    (entry: StackEntry, changes: Partial<StackEntry>) => {
      const layerChanges: Record<string, unknown> = {};
      if (changes.depth !== undefined) layerChanges.zIndex = changes.depth;
      if (changes.concealed !== undefined)
        layerChanges.hidden = changes.concealed;
      if (changes.seeThrough !== undefined)
        layerChanges.opacity = changes.seeThrough;

      if (entry.kind === "screenshot") updateScreenshotLayer(layerChanges);
      if (entry.kind === "slot") {
        const shared: Record<string, unknown> = {};
        if (changes.seeThrough !== undefined)
          shared.opacity = changes.seeThrough;
        if (Object.keys(shared).length > 0) updateScreenshotLayer(shared);
        const perSlot: Record<string, unknown> = {};
        if (changes.depth !== undefined) perSlot.zIndex = changes.depth;
        if (changes.concealed !== undefined) perSlot.hidden = changes.concealed;
        if (Object.keys(perSlot).length > 0) updateSlot(entry.id, perSlot);
      }
      if (entry.kind === "asset") updateAsset(entry.id, layerChanges);
      if (entry.kind === "text") updateText(entry.id, layerChanges);
      if (entry.origin === "annotation-stroke")
        updateAnnotationStrokeLayer(entry.id, layerChanges);
      if (entry.origin === "annotation-shape")
        updateAnnotationShape(entry.id, layerChanges);
    },
    [
      updateScreenshotLayer,
      updateSlot,
      updateAsset,
      updateText,
      updateAnnotationStrokeLayer,
      updateAnnotationShape,
    ],
  );

  const removeEntry = React.useCallback(
    (entry: StackEntry) => {
      setPickedUid(null);
      if (entry.kind === "slot") deleteSlot(entry.id);
      if (entry.kind === "asset") deleteAsset(entry.id);
      if (entry.kind === "text") deleteText(entry.id);
      if (entry.origin === "annotation-stroke")
        deleteAnnotationStroke(entry.id);
      if (entry.origin === "annotation-shape") deleteAnnotationShape(entry.id);
    },
    [
      deleteSlot,
      deleteAsset,
      deleteText,
      deleteAnnotationStroke,
      deleteAnnotationShape,
    ],
  );

  const reorderTo = React.useCallback(
    (reordered: StackEntry[]) => {
      const count = reordered.length;
      reordered.forEach((entry, i) => {
        const nextDepth = count - i;
        if (entry.depth !== nextDepth) patchEntry(entry, { depth: nextDepth });
      });
    },
    [patchEntry],
  );

  return {
    entries,
    activeUid,
    pickEntry,
    patchEntry,
    removeEntry,
    reorderTo,
    deviceFrame: editor.deviceFrame,
    setDeviceFrame: editor.setDeviceFrame,
  };
}

const restrictYAxis: Modifier = ({
  activeNodeRect,
  containerNodeRect,
  transform,
}) => {
  let y = transform.y;
  if (activeNodeRect && containerNodeRect) {
    const minY = containerNodeRect.top - activeNodeRect.top;
    const maxY = containerNodeRect.bottom - activeNodeRect.bottom;
    y = Math.min(maxY, Math.max(minY, y));
  }
  return { ...transform, x: 0, y };
};

export function LayersPanel({ flat }: { flat?: boolean }) {
  const {
    entries,
    activeUid,
    pickEntry,
    patchEntry,
    removeEntry,
    reorderTo,
    deviceFrame,
    setDeviceFrame,
  } = useLayerStack();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const frozenItemsRef = React.useRef<string[] | null>(null);
  const items =
    frozenItemsRef.current ??
    React.useMemo(() => entries.map((e) => e.uid), [entries]);

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) {
      frozenItemsRef.current = null;
      return;
    }
    const from = entries.findIndex((l) => l.uid === active.id);
    const to = entries.findIndex((l) => l.uid === over.id);
    if (from < 0 || to < 0) {
      frozenItemsRef.current = null;
      return;
    }
    reorderTo(arrayMove(entries, from, to));
    frozenItemsRef.current = null;
  }

  function shiftEntry(entry: StackEntry, dir: "up" | "down") {
    const from = entries.findIndex((l) => l.uid === entry.uid);
    const to = dir === "up" ? from - 1 : from + 1;
    if (from < 0 || to < 0 || to >= entries.length) return;
    reorderTo(arrayMove(entries, from, to));
  }

  return (
    <div className={cn(flat ? "w-full p-2" : "w-75 p-2")}>
      <div className="mb-3 flex items-center justify-between px-2">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Layers
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictYAxis]}
        onDragStart={() => {
          document.body.style.userSelect = "none";
          frozenItemsRef.current = entries.map((e) => e.uid);
        }}
        onDragEnd={(e) => {
          document.body.style.userSelect = "";
          handleDragEnd(e);
        }}
        onDragCancel={() => {
          document.body.style.userSelect = "";
          frozenItemsRef.current = null;
        }}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <ul
            className={cn(
              "flex flex-col gap-1 pr-1",
              !flat && "max-h-[60vh] overflow-y-auto",
            )}
          >
            {entries.map((entry, i) => (
              <StackRow
                key={entry.uid}
                entry={entry}
                active={activeUid === entry.uid}
                isPeak={i === 0}
                isBase={i === entries.length - 1}
                onSelect={() => pickEntry(entry)}
                onToggleVisibility={() =>
                  patchEntry(entry, { concealed: !entry.concealed })
                }
                onMoveUp={() => shiftEntry(entry, "up")}
                onMoveDown={() => shiftEntry(entry, "down")}
                onDelete={
                  entry.kind !== "screenshot"
                    ? () => removeEntry(entry)
                    : undefined
                }
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {deviceFrame.id !== "none" ? (
        <div className="mt-1 pr-1">
          <FrameBar
            deviceFrame={deviceFrame}
            onDelete={() =>
              setDeviceFrame({
                id: "none",
                variantId: "black",
                orientation: "vertical",
              })
            }
          />
        </div>
      ) : null}

      <div className="mt-2 pr-1">
        <div className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:bg-foreground/10/3">
          <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-foreground/15 bg-overlay/60 shadow-sm">
            <BackgroundSwatch />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-medium leading-tight text-foreground/90">
              Background
            </div>
            <div className="tabular truncate font-mono text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Locked
            </div>
          </div>
          <Lock className="size-3.5 shrink-0 text-muted-foreground/40" />
        </div>
      </div>
    </div>
  );
}

function StackRow({
  entry,
  active,
  isPeak,
  isBase,
  onSelect,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  entry: StackEntry;
  active: boolean;
  isPeak: boolean;
  isBase: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.uid });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "group relative flex items-center gap-2 rounded-lg border px-2 py-1.5 outline-none transition-all",
        active
          ? "border-primary/20 bg-primary/12"
          : "border-transparent hover:bg-foreground/10/3",
        entry.concealed && "opacity-55",
        isDragging &&
          "z-50 border-foreground/15 bg-background/80 shadow-[0_12px_30px_-10px_color-mix(in_oklab,var(--overlay)_50%,transparent)] backdrop-blur-xl",
      )}
    >
      {active && (
        <div className="absolute left-0 top-1/2 h-[60%] w-0.75 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
      )}
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag layer"
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: "none" }}
        className={cn(
          "flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/40 transition-colors select-none hover:text-foreground active:cursor-grabbing",
          active
            ? "text-primary/60 hover:text-primary"
            : "group-hover:text-muted-foreground",
        )}
      >
        <GripVertical className="size-3.5" />
      </button>
      <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-foreground/15 bg-overlay/60 text-muted-foreground shadow-sm">
        {entry.preview ? (
          <EntryPreview
            key={entry.preview}
            src={entry.preview}
            kind={entry.kind}
          />
        ) : (
          <KindIcon kind={entry.kind} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate text-[12px] leading-tight",
            active ? "font-medium text-primary" : "text-foreground/90",
          )}
        >
          {entry.label}
        </div>
        <div className="tabular truncate font-mono text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">
          {entry.subtitle}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          disabled={isPeak}
          aria-label="Move layer up"
          className={cn(
            "flex size-6 items-center justify-center rounded-md transition-colors disabled:opacity-30",
            active
              ? "text-primary/70 hover:bg-primary/20 hover:text-primary"
              : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
          )}
        >
          <ChevronUp className="size-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          disabled={isBase}
          aria-label="Move layer down"
          className={cn(
            "flex size-6 items-center justify-center rounded-md transition-colors disabled:opacity-30",
            active
              ? "text-primary/70 hover:bg-primary/20 hover:text-primary"
              : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
          )}
        >
          <ChevronDown className="size-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          aria-label={entry.concealed ? "Show layer" : "Hide layer"}
          className={cn(
            "flex size-6 items-center justify-center rounded-md transition-colors",
            active
              ? "text-primary/70 hover:bg-primary/20 hover:text-primary"
              : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
          )}
        >
          {entry.concealed ? (
            <EyeClosed className="size-3.5" />
          ) : (
            <Eye className="size-3.5" />
          )}
        </button>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete layer"
            className={cn(
              "flex size-6 items-center justify-center rounded-md transition-colors hover:bg-danger-soft hover:text-danger",
              active ? "text-primary/70" : "text-muted-foreground",
            )}
          >
            <Trash className="size-3.5" />
          </button>
        )}
      </div>
    </li>
  );
}

function BackgroundSwatch() {
  const { background } = useEditor();
  return (
    <span
      aria-hidden
      className={cn(
        "block h-full w-full",
        background.type === "none" && "bg-transparency-checker",
      )}
      style={backgroundCss(background)}
    />
  );
}

function EntryPreview({ src, kind }: { src: string; kind: StackEntryKind }) {
  const [broken, setBroken] = React.useState(false);

  if (broken) return <KindIcon kind={kind} />;

  return (
    <ProgressiveImage
      src={src}
      alt=""
      draggable={false}
      className="size-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

function KindIcon({ kind }: { kind: StackEntryKind }) {
  if (kind === "text") return <Type className="size-3.5" />;
  if (kind === "annotation") return <LineSquiggle className="size-3.5" />;
  if (kind === "slot") return <Images className="size-3.5" />;

  return <ImageIcon className="size-3.5" />;
}

function FrameBar({
  deviceFrame,
  onDelete,
}: {
  deviceFrame: DeviceFrame;
  onDelete: () => void;
}) {
  const browserFrame = BROWSER_FRAMES.find((f) => f.id === deviceFrame.id);
  const deviceFrameModel = lookupDynamicDeviceFrameModel(deviceFrame.id);
  const name = browserFrame?.name ?? deviceFrameModel?.name ?? "Frame";

  return (
    <div className="flex items-center gap-2 group rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:bg-foreground/10/3">
      <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-foreground/15 bg-overlay/60 text-muted-foreground shadow-sm">
        <MonitorSmartphone className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-medium leading-tight text-foreground/90">
          {name}
        </div>
        <div className="tabular truncate font-mono text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">
          Locked
        </div>
      </div>{" "}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete layer"
            className={cn(
              "flex size-6 items-center justify-center rounded-md transition-colors text-muted-foreground hover:bg-danger-soft hover:text-danger",
            )}
          >
            <Trash className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
