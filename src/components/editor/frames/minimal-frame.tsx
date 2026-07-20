import { FrameProps } from "./types";

export function MinimalFrame({ children, style, borderRadius, className, imageAspectRatio, theme = "light" }: FrameProps) {
  const isDark = theme === "dark";
  const bg = isDark ? "#1C1C1C" : "#F7F7F7";
  const dotColor = isDark ? "#444" : "#D1D1D1";

  return (
    <div
      className={className}
      style={{
        ...style,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        backgroundColor: bg,
        boxShadow: isDark ? "inset 0 0 0 1px rgba(255,255,255,0.05)" : "inset 0 0 0 1px rgba(0,0,0,0.05)",
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          height: "2.4em",
          display: "flex",
          alignItems: "center",
          padding: "0 1.2em",
          gap: "0.5em",
        }}
      >
        <div style={{ width: "0.6em", height: "0.6em", borderRadius: "50%", backgroundColor: dotColor }} />
        <div style={{ width: "0.6em", height: "0.6em", borderRadius: "50%", backgroundColor: dotColor }} />
        <div style={{ width: "0.6em", height: "0.6em", borderRadius: "50%", backgroundColor: dotColor }} />
      </div>

      <div
        style={{
          display: "flex",
          overflow: "hidden",
          backgroundColor: isDark ? "#000" : "#fff",
          ...(imageAspectRatio ? { aspectRatio: String(imageAspectRatio) } : {}),
        }}
      >
        {children}
      </div>
    </div>
  );
}
