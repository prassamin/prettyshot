/**
 * Panel tool provider — the single source of truth for which tool is active on desktop.
 *
 * The left sidebar is a tool rail (navigation), the right property panel shows the
 * selected tool's controls. This context bridges them; `view.tsx` mounts
 * the provider around both sidebars.
 */

"use client";

import * as React from "react";

export type PanelTool =
  | "animation"
  | "frame"
  | "background"
  | "backdrop"
  | "border"
  | "transform"
  | "shadow";

type PanelToolContextValue = {
  tool: PanelTool;
  setTool: (tool: PanelTool) => void;
};

const PanelToolContext = React.createContext<PanelToolContextValue | null>(
  null,
);

export function PanelToolProvider({
  children,
  initialTool = "background",
}: {
  children: React.ReactNode;
  initialTool?: PanelTool;
}) {
  const [tool, setTool] = React.useState<PanelTool>(initialTool);

  return (
    <PanelToolContext.Provider value={{ tool, setTool }}>
      {children}
    </PanelToolContext.Provider>
  );
}

export function usePanelTool(): PanelToolContextValue {
  const ctx = React.useContext(PanelToolContext);
  if (!ctx) {
    throw new Error("usePanelTool must be used within PanelToolProvider");
  }
  return ctx;
}
