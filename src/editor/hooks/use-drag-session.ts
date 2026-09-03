"use client"

/**
 * useDragSession — lightweight session tracker for drag operations.
 *
 * Why this exists:
 *   Callback clean-up in requestAnimationFrame often needs to know if the
 *   originating drag is still active (e.g. the user started a new drag before
 *   the previous RAF callback fired). This hook provides a monotonically
 *   increasing token that lets callbacks check staleness cheaply.
 *
 * Usage:
 *   const session = useDragSession()
 *   session.next()                // mark a new session
 *   const tok = session.value()   // read the current token
 *   session.matches(tok)          // false if a new session started since
 */

import * as React from "react"

export type SessionHandle = {
  next: () => void
  value: () => number
  matches: (token: number) => boolean
}

export function useDragSession(): SessionHandle {
  const ref = React.useRef(0)
  return React.useMemo(
    () => ({
      next: () => {
        ref.current += 1
      },
      value: () => ref.current,
      matches: (token: number) => ref.current === token,
    }),
    [],
  )
}
