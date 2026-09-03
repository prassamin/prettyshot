import * as React from "react"

import { cn } from "@/lib/utils"

type InnerLightingOverlayProps = {
  style: React.CSSProperties | null | undefined
  className?: string
}

export function InnerLightingOverlay({
  style,
  className,
}: InnerLightingOverlayProps) {
  if (!style) return null
  return (
    <div
      aria-hidden
      data-export-stack="foreground"
      data-export-inner-lighting=""
      className={cn("pointer-events-none absolute inset-0 z-10", className)}
      style={style}
    />
  )
}
