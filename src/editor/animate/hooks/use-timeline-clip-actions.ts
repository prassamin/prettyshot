"use client";

import * as React from "react";
import { toast } from "@heroui/react";
import { useShortcuts } from "@keybindy/react";

import { useEditorEngine } from "@/editor/lib/engine";

import type { UseTimelineSelection } from "./use-timeline-selection";
import { useFeatureGate } from "@/hooks/use-feature-gate";

type Options = {
  selection: UseTimelineSelection;
  clips: any[];
  togglePlay: () => void;
};

/**
 * Clip deletion, the razor (cut) tool, exiting animate mode, and the keyboard
 * shortcuts that drive them.
 */
export function useTimelineClipActions({
  selection,
  clips,
  togglePlay,
}: Options) {
  const gate = useFeatureGate();
  const duplicateAnimationClips = useEditorEngine(
    (s: any) => s.duplicateAnimationClips,
  );
  const removeAnimationClips = useEditorEngine(
    (s: any) => s.removeAnimationClips,
  );
  const clearAnimationClipsEffects = useEditorEngine(
    (s: any) => s.clearAnimationClipsEffects,
  );
  const setIsAnimateMode = useEditorEngine((s: any) => s.setIsAnimateMode);

  const selectClip = selection.selectClip;
  const selectClips = selection.selectClips;
  const selectedClipIds = selection.selectedClipIds;
  const selectedIdsRef = React.useRef(selectedClipIds);
  React.useEffect(() => {
    selectedIdsRef.current = selectedClipIds;
  }, [selectedClipIds]);

  const clipsRef = React.useRef(clips);
  React.useEffect(() => {
    clipsRef.current = clips;
  }, [clips]);

  const reselectAfterDelete = React.useCallback(
    (removed: string[]) => {
      const removedSet = new Set(removed);
      const remaining = clipsRef.current
        .filter((c: any) => !removedSet.has(c.id))
        .sort((a: any, b: any) => a.startMs - b.startMs);
      selectClip(remaining.length ? remaining[remaining.length - 1].id : null);
    },
    [selectClip],
  );

  const deleteSelectedClip = React.useCallback(() => {
    const ids = selectedIdsRef.current;
    if (ids.length === 0) return;
    removeAnimationClips(ids);
    reselectAfterDelete(ids);
  }, [removeAnimationClips, reselectAfterDelete]);

  // --- razor (cut) tool ----------------------------------------------------
  const [razorMode, setRazorMode] = React.useState(false);
  const razorModeRef = React.useRef(false);
  React.useEffect(() => {
    razorModeRef.current = razorMode;
  }, [razorMode]);

  const canRazor = clips.length > 0;
  React.useEffect(() => {
    if (clips.length === 0) setRazorMode(false);
  }, [clips.length]);

  const toggleRazor = React.useCallback(() => {
    setRazorMode((prev: any) => (clipsRef.current.length > 0 ? !prev : false));
  }, []);

  const requestExit = React.useCallback(() => {
    setIsAnimateMode(false);
  }, [setIsAnimateMode]);

  // --- shortcuts -----------------------------------------------------------
  useShortcuts(
    [
      {
        keys: [["Delete"], ["Backspace"]],
        handler(event: KeyboardEvent) {
          const ids = selectedIdsRef.current;
          event.preventDefault();
          removeAnimationClips(ids);
          reselectAfterDelete(ids);
        },
      },
      {
        keys: [
          ["Ctrl", "Delete"],
          ["Ctrl", "Backspace"],
          ["Meta", "Delete"],
          ["Meta", "Backspace"],
        ],
        handler(event: KeyboardEvent) {
          event.preventDefault();
          clearAnimationClipsEffects(selectedIdsRef.current);
        },
      },
      {
        keys: [
          ["Ctrl", "D"],
          ["Meta", "D"],
        ],
        handler(event: KeyboardEvent) {
          event.preventDefault();
          const newIds = duplicateAnimationClips(selectedIdsRef.current);
          if (newIds.length) selectClips(newIds);
          else toast.danger("Could not duplicate the keyframe");
        },
      },
      {
        keys: ["S"],
        handler(event: KeyboardEvent) {
          event.preventDefault();
          toggleRazor();
        },
      },
      {
        keys: ["Space"],
        handler(event: KeyboardEvent) {
          event.preventDefault();
          togglePlay();
        },
      },
      {
        keys: ["Esc"],
        handler(event: KeyboardEvent) {
          event.stopPropagation();
          event.preventDefault();
          if (razorModeRef.current) {
            setRazorMode(false);
            return;
          }
          requestExit();
        },
      },
    ],
    {
      ignoreInputs: true,
      scope: "animate",
      scopeMode: "cascade",
      beforeEach: (s) => {
        if (
          s.keys[0].toLowerCase() === "esc" ||
          s.keys[0].toLowerCase() === "space"
        )
          return true;
        if (selectedIdsRef.current.length === 0) return false;
        if (!gate.can("animate")) return false;
      },
    },
  );

  return {
    razorMode,
    razorModeRef,
    canRazor,
    toggleRazor,
    requestExit,
    deleteSelectedClip,
  };
}
