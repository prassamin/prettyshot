import { FrameProps } from "./types";

export function MacosFrame({ children, style, className, imageAspectRatio, theme = "light" }: FrameProps) {
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
          display: "flex",
          alignItems: "center",
          padding: "1.2em 1.6em",
          gap: "0.8em",
          backgroundColor: isDark ? "#2d2d2d" : "rgba(255, 255, 255, 0.95)",
          boxShadow: isDark ? "0 1px 0 0 rgba(0,0,0,0.5)" : "0 1px 0 0 rgba(0,0,0,0.06)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", gap: "0.8em", width: "6em", flexShrink: 0 }}>
          <svg width="1.2em" height="1.2em" viewBox="0 0 12 12" style={{ display: "block", overflow: "visible" }}>
             <circle cx="6" cy="6" r="5.5" fill="#ff5f56" stroke="#e0443e" strokeWidth="1" />
          </svg>
          <svg width="1.2em" height="1.2em" viewBox="0 0 12 12" style={{ display: "block", overflow: "visible" }}>
             <circle cx="6" cy="6" r="5.5" fill="#ffbd2e" stroke="#dea123" strokeWidth="1" />
          </svg>
          <svg width="1.2em" height="1.2em" viewBox="0 0 12 12" style={{ display: "block", overflow: "visible" }}>
             <circle cx="6" cy="6" r="5.5" fill="#27c93f" stroke="#1aab29" strokeWidth="1" />
          </svg>
        </div>
      </div>
      <div style={{ display: "flex", overflow: "hidden", minHeight: 0, ...(imageAspectRatio ? { aspectRatio: String(imageAspectRatio) } : {}) }}>
        {children}
      </div>
    </div>
  );
}
