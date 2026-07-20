import { FrameProps } from "./types";

export function GlassFrame({ children, style, borderRadius, className, imageAspectRatio, theme = "light" }: FrameProps) {
  const isDark = theme === "dark";
  return (
    <div
      className={className}
      style={{
        ...style,
        overflow: "hidden",
        display: "flex",
        padding: "1.6em",
        backgroundColor: isDark ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          ...(imageAspectRatio ? { aspectRatio: String(imageAspectRatio) } : {}),
          borderRadius: `calc(max(0px, ${borderRadius}px - 16px) * var(--frame-scale, 1))`,
          boxShadow: isDark ? "inset 0 0 0 1px rgba(255,255,255,0.1)" : "inset 0 0 0 1px rgba(255,255,255,0.4)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
