"use client";

import * as React from "react";
import { RULER_FRAME_STEPS } from "@/editor/lib/animation/timeline";
import { cn } from "@/lib/utils";

import { formatRulerTimecode, FRAMES_PER_SEC, getRulerSubdivisions } from "./ruler-ticks";

type TimelineRulerProps = {
  ticks: number[];
  durationMs: number;
  pxFor: (ms: number) => number;
  className?: string;
};

/**
 * Precision 30fps timeline ruler.
 *
 * Features:
 * - Frame-accurate 30fps division (1f, 2f, 5f, 6f, 10f, 15f, 30f = 1s, etc.)
 * - 3-tier tick hierarchy: major ticks (10px with timecode), mid ticks (6px at
 *   the halfway mark), minor ticks (3.5px)
 * - Exact mathematical spacing so individual frame lines sit at true pixel
 *   positions between whole seconds
 * - Batched SVG paths for 60fps scrub with crisp pixel alignment
 */
export function TimelineRuler({
  ticks,
  durationMs,
  pxFor,
  className,
}: TimelineRulerProps) {
  const rulerData = React.useMemo(() => {
    const pps = Math.max(1, pxFor(1000) - pxFor(0));
    const pxPerFrame = pps / FRAMES_PER_SEC;
    const majorFrames =
      RULER_FRAME_STEPS.find((f) => f * pxPerFrame >= 56) ?? 30;
    const { minorFrames, midFrames } = getRulerSubdivisions(majorFrames, pps);

    const endMs = Math.max(
      durationMs + 15000,
      ticks.length > 0 ? (ticks[ticks.length - 1] ?? 0) * 1000 : 60000,
    );
    const totalFrames =
      Math.ceil((endMs / 1000) * FRAMES_PER_SEC) + majorFrames * 2;

    let activeMajorPath = "";
    let beyondMajorPath = "";
    let activeMidPath = "";
    let beyondMidPath = "";
    let activeMinorPath = "";
    let beyondMinorPath = "";

    const labels: Array<{
      key: string;
      frame: number;
      x: number;
      text: string;
      beyond: boolean;
      isFirst: boolean;
    }> = [];

    for (let f = 0; f <= totalFrames; f += minorFrames) {
      const ms = (f / FRAMES_PER_SEC) * 1000;
      const x = Math.round(pxFor(ms) * 10) / 10;
      const isBeyond = ms > durationMs + 1;

      const isMajor = f % majorFrames === 0;
      const isMid =
        !isMajor &&
        midFrames != null &&
        (f % midFrames === 0 || f % majorFrames === midFrames);

      if (isMajor) {
        // Major tick line (y: 13 -> 23)
        const majorLine = `M ${x} 13 V 23 `;
        if (isBeyond) {
          beyondMajorPath += majorLine;
        } else {
          activeMajorPath += majorLine;
        }

        labels.push({
          key: `f-${f}`,
          frame: f,
          x,
          text: formatRulerTimecode(f, majorFrames),
          beyond: isBeyond,
          isFirst: f === 0 || x < 18,
        });
      } else if (isMid) {
        // Mid-interval tick line (y: 17 -> 23)
        const midLine = `M ${x} 17 V 23 `;
        if (isBeyond) {
          beyondMidPath += midLine;
        } else {
          activeMidPath += midLine;
        }
      } else {
        // Minor tick line (y: 19.5 -> 23)
        const minorLine = `M ${x} 19.5 V 23 `;
        if (isBeyond) {
          beyondMinorPath += minorLine;
        } else {
          activeMinorPath += minorLine;
        }
      }
    }

    return {
      activeMajorPath,
      beyondMajorPath,
      activeMidPath,
      beyondMidPath,
      activeMinorPath,
      beyondMinorPath,
      labels,
    };
  }, [ticks, durationMs, pxFor]);

  return (
    <div className={cn("relative h-6 w-full select-none", className)}>
      <svg
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
        shapeRendering="crispEdges"
      >
        {/* Ruler bottom baseline separator */}
        <line
          x1="0"
          y1="23.5"
          x2="100%"
          y2="23.5"
          className="stroke-border"
          strokeWidth="1"
        />

        {/* Minor ticks */}
        {rulerData.activeMinorPath && (
          <path
            d={rulerData.activeMinorPath}
            className="stroke-border/70"
            strokeWidth="1"
          />
        )}
        {rulerData.beyondMinorPath && (
          <path
            d={rulerData.beyondMinorPath}
            className="stroke-border/30"
            strokeWidth="1"
          />
        )}

        {/* Mid ticks */}
        {rulerData.activeMidPath && (
          <path
            d={rulerData.activeMidPath}
            className="stroke-muted-foreground/40"
            strokeWidth="1"
          />
        )}
        {rulerData.beyondMidPath && (
          <path
            d={rulerData.beyondMidPath}
            className="stroke-muted-foreground/20"
            strokeWidth="1"
          />
        )}

        {/* Major ticks */}
        {rulerData.activeMajorPath && (
          <path
            d={rulerData.activeMajorPath}
            className="stroke-muted-foreground/80"
            strokeWidth="1"
          />
        )}
        {rulerData.beyondMajorPath && (
          <path
            d={rulerData.beyondMajorPath}
            className="stroke-muted-foreground/35"
            strokeWidth="1"
          />
        )}

        {/* Timecode labels */}
        {rulerData.labels.map((lbl) => (
          <text
            key={lbl.key}
            x={lbl.isFirst ? Math.max(2, lbl.x + 3) : lbl.x}
            y={11}
            textAnchor={lbl.isFirst ? "start" : "middle"}
            className={cn(
              "font-mono text-[9.5px] font-medium tracking-tight select-none",
              lbl.beyond
                ? "fill-muted-foreground/40"
                : "fill-muted-foreground",
            )}
          >
            {lbl.text}
          </text>
        ))}
      </svg>
    </div>
  );
}
