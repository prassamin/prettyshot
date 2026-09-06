"use client";

import * as React from "react";

export function ScreenshotStage({
  padding,
  transformedBoxStyle,
  selectionRadius,
  contentTransform,
  showSelectionBorder,
  editMenu,
  children,
}: {
  padding: number;
  transformedBoxStyle: React.CSSProperties;
  selectionRadius: number | string;
  contentTransform: string;
  showSelectionBorder: boolean;
  editMenu?: React.ReactNode;
  children: React.ReactNode;
}) {
  const contentStyle: React.CSSProperties = {
    padding: `var(--editor-padding-preview, ${Math.max(0, Math.min(240, padding)) / 12}%)`,
  };
  return (
    <div className="absolute inset-0" style={contentStyle}>
      <div className="relative h-full w-full" style={transformedBoxStyle}>
        {}
        {showSelectionBorder ? (
          <div
            aria-hidden
            data-selection-border="true"
            className="pointer-events-none absolute inset-0 z-50 outline-2 outline-offset-2 outline-primary outline-dashed"
            style={{
              transform: contentTransform,
              transformStyle: "preserve-3d",
              borderRadius: selectionRadius,
            }}
          />
        ) : null}
        {}
        <div
          className="relative h-full w-full"
          style={{
            transform: "var(--anim-transform, none)",
            opacity: "var(--anim-opacity, 1)" as unknown as number,
            filter: "var(--anim-filter, none)",
            transformOrigin: "center",
          }}
        >
          {children}
        </div>
        {editMenu}
      </div>
    </div>
  );
}
