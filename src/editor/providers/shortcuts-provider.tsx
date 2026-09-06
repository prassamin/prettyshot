import { useEditor, useEditorEngine } from "@/editor/lib/engine";
import { EditorToolBarTool } from "@/types/editor";
import { useShortcuts } from "@keybindy/react";
import { isShortcutCombo } from "../lib";
import { AnnotationMode } from "../elements/types";
import { useRef } from "react";
import { copyCanvasAsPng } from "../lib/export";
import { toast } from "@heroui/react";
import { useFeatureGate } from "@/hooks/use-feature-gate";

export const ShortcutsProvider = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const {
    setActiveTool,
    setAnnotation,
    addText,
    setSelectedTextId,
    setSelectedSlotId,
    setIsScreenshotSelected,
    setIsPreviewMode,
    isPreviewMode,
  } = useEditor();
  const isCopyingCanvasRef = useRef(false);
  const gate = useFeatureGate();

  const handleTool = (
    toolId: EditorToolBarTool,
    annotationMode?: AnnotationMode,
  ) => {
    if (toolId === "text") {
      const newId = addText();
      setSelectedTextId(newId);
      setSelectedSlotId(null);
      setIsScreenshotSelected(false);
      setActiveTool("pointer");
      return;
    }
    setActiveTool(toolId);
    if (annotationMode) {
      setAnnotation({ mode: annotationMode });
    }
  };

  // annotation shortcuts
  useShortcuts(
    [
      {
        keys: ["A"],
        handler() {
          handleTool("draw", "arrow");
        },
      },
      {
        keys: ["R"],
        handler() {
          handleTool("draw", "rect");
        },
      },
      {
        keys: ["O"],
        handler() {
          handleTool("draw", "ellipse");
        },
      },
      {
        keys: ["P"],
        handler() {
          handleTool("draw", "pen");
        },
      },
      {
        keys: ["H"],
        handler() {
          handleTool("draw", "highlight");
        },
      },
      {
        keys: ["E"],
        handler() {
          handleTool("draw", "eraser");
        },
      },
    ],
    {
      ignoreInputs: true,
      scope: "editor",
      beforeEach: (_, e) => {
        if (isShortcutCombo(e)) return false;
        if (!gate.can("elements.annotations")) {
          gate.message();
          return false;
        }
      },
    },
  );

  useShortcuts(
    [
      {
        keys: ["V"],
        handler: () => {
          handleTool("pointer");
        },
      },
      {
        keys: ["Esc"],
        handler(e) {
          e.preventDefault();
          if (isPreviewMode) {
            setIsPreviewMode(false);
            return;
          }
          setSelectedTextId(null);
          setActiveTool("pointer");
        },
      },
      {
        keys: ["T"],
        handler() {
          if (!gate.can("elements.text")) return gate.message();
          handleTool("text");
        },
      },
      {
        keys: [["Delete"], ["Backspace"]],
        handler(e: KeyboardEvent) {
          const store = useEditorEngine.getState();
          const {
            selectedTextId,
            selectedAssetId,
            selectedAnnotationShapeId,
            selectedAnnotationStrokeId,
            selectedSlotId,
            isScreenshotSelected,
          } = store;

          if (selectedTextId) {
            e.preventDefault();
            e.stopImmediatePropagation();
            store.deleteText(selectedTextId);
            store.setSelectedTextId(null);
            return;
          }

          if (selectedAssetId) {
            e.preventDefault();
            e.stopImmediatePropagation();
            store.deleteAsset(selectedAssetId);
            store.setSelectedAssetId(null);
            return;
          }

          if (selectedAnnotationShapeId) {
            e.preventDefault();
            e.stopImmediatePropagation();
            store.deleteAnnotationShape(selectedAnnotationShapeId);
            store.setSelectedAnnotationShapeId(null);
            return;
          }

          if (selectedAnnotationStrokeId) {
            e.preventDefault();
            e.stopImmediatePropagation();
            store.deleteAnnotationStroke(selectedAnnotationStrokeId);
            store.setSelectedAnnotationStrokeId(null);
            return;
          }

          if (selectedSlotId) {
            e.preventDefault();
            e.stopImmediatePropagation();
            store.deleteSlot(selectedSlotId);
            store.setSelectedSlotId(null);
            return;
          }

          if (isScreenshotSelected) {
            e.preventDefault();
            e.stopImmediatePropagation();
            store.setScreenshot(null);
            store.setIsScreenshotSelected(false);
          }
        },
      },
    ],
    {
      ignoreInputs: true,
      scope: "editor",
      beforeEach: (_, e) => {
        if (isShortcutCombo(e)) return false;
      },
    },
  );

  useShortcuts(
    [
      {
        keys: ["Ctrl", "Z"],
        handler(e) {
          e.preventDefault();
          useEditorEngine.getState().undo();
        },
      },
      {
        keys: [
          ["Shift", "Z"],
          ["Ctrl", "Y"],
        ],
        handler(e) {
          e.preventDefault();
          useEditorEngine.getState().redo();
        },
      },
      {
        keys: ["Ctrl", "C"],
        handler(e) {
          e.preventDefault();
          if (isCopyingCanvasRef.current) return;

          const canvasId = useEditorEngine.getState().present.id;

          isCopyingCanvasRef.current = true;
          toast.promise(
            copyCanvasAsPng(canvasId, "1080p", { watermark: true }),
            {
              error: (e) => {
                isCopyingCanvasRef.current = false;
                return `Copy failed. ${e.message}`;
              },
              loading: "Copying to clipboard…",
              success: () => {
                isCopyingCanvasRef.current = false;
                return `Copied to clipboard`;
              },
            },
          );
        },
      },
    ],
    { scope: "editor", ignoreInputs: true },
  );

  // Manual save shortcut (Ctrl+S / Cmd+S)
  useShortcuts(
    [
      {
        keys: ["Ctrl", "S"],
        handler(e) {
          e.preventDefault();
          useEditorEngine.getState().requestSave();
        },
      },
    ],
    { scope: "editor", ignoreInputs: false },
  );

  return <>{children}</>;
};
