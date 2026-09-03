/**
 * EmptyBackdrop — shared background shell for empty/drop states.
 *
 * The universal "nothing here yet" canvas: a full-size, background-colored
 * box that every drop prompt variant layers its content on. Exported as a
 * `forwardRef` primitive so callers (drop prompts, browser/device empty
 * states) can attach drag metrics (`data-drag-over`) and sizing
 * (`containerType`) without duplicating the base styles.
 *
 * Dev note: consumers set `containerType: "inline-size"` on the style prop
 * to enable `cqw` sizing for their children (upload zone chips etc.).
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type EmptyBackdropProps = React.HTMLAttributes<HTMLDivElement>;

export const EmptyBackdrop = React.forwardRef<
  HTMLDivElement,
  EmptyBackdropProps
>(function EmptyBackdrop({ className, children, ...rest }, ref) {
  return (
    <div
      {...rest}
      ref={ref}
      className={cn(
        "relative size-full bg-foreground/5 backdrop-blur-sm border border-foreground/10 transition-all duration-300 ease-out hover:bg-foreground/8 hover:border-foreground/15 rounded-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
});
