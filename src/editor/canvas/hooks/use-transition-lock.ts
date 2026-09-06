"use client";

import * as React from "react";

/**
 * Temporarily locks/suppresses CSS transitions for 2 animation frames when a value changes.
 * This prevents visual layout snapping or jumping when switching presets, aspect ratios, or paddings.
 */
export function useTransitionLock(triggerValue: unknown): boolean {
  const [isLocked, setIsLocked] = React.useState(false);
  const previousValueRef = React.useRef(triggerValue);

  React.useEffect(() => {
    if (previousValueRef.current === triggerValue) return;

    previousValueRef.current = triggerValue;
    setIsLocked(true);

    let secondFrameId = 0;
    const firstFrameId = requestAnimationFrame(() => {
      secondFrameId = requestAnimationFrame(() => {
        setIsLocked(false);
      });
    });

    return () => {
      cancelAnimationFrame(firstFrameId);
      if (secondFrameId) cancelAnimationFrame(secondFrameId);
    };
  }, [triggerValue]);

  return isLocked;
}
