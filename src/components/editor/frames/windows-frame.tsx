import { Minus, Square, X } from "lucide-react";
import { FrameProps } from "./types";

export function WindowsFrame({ children, style, className, imageAspectRatio, theme = "light" }: FrameProps) {
  const isDark = theme === "dark";
  return (
    <div
      className={className}
      style={{
        ...style,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        backgroundColor: isDark ? "#000" : "#fff",
      }}
    >
      <div
        style={{
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          height: "3.6em",
          backgroundColor: isDark ? "#1e1e1e" : "#f3f3f3",
          boxShadow: isDark ? "0 1px 0 0 rgba(0,0,0,0.5)" : "0 1px 0 0 rgba(0,0,0,0.06)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", flex: 1, alignItems: "center", paddingLeft: "1.6em" }}>
        </div>
        <div style={{ padding: "1em 1.6em", color: isDark ? "#ccc" : "#666", display: "flex", alignItems: "center" }}>
          <Minus style={{ width: "1.4em", height: "1.4em", display: "block" }} />
        </div>
        <div style={{ padding: "1em 1.6em", color: isDark ? "#ccc" : "#666", display: "flex", alignItems: "center" }}>
          <Square style={{ width: "1.2em", height: "1.2em", display: "block" }} />
        </div>
        <div style={{ padding: "1em 1.6em", color: isDark ? "#ccc" : "#666", display: "flex", alignItems: "center" }}>
          <X style={{ width: "1.6em", height: "1.6em", display: "block" }} />
        </div>
      </div>
      <div style={{ display: "flex", overflow: "hidden", minHeight: 0, ...(imageAspectRatio ? { aspectRatio: String(imageAspectRatio) } : {}) }}>
        {children}
      </div>
    </div>
  );
}
