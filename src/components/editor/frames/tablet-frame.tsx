import { FrameProps } from "./types";

export function TabletFrame({ children, style, borderRadius, className, imageAspectRatio, theme = "light" }: FrameProps) {
  const isDark = theme === "dark";
  const bezelColor = isDark ? "#121212" : "#E5E5EA";
  const innerBg = isDark ? "#000" : "#fff";

  return (
    <div
      className={className}
      style={{
        ...style,
        backgroundColor: bezelColor,
        padding: "3.5em",
        position: "relative",
        display: "flex",
        boxShadow: isDark ? "inset 0 0 0 1px rgba(255,255,255,0.05), 0 10px 40px rgba(0,0,0,0.5)" : "inset 0 0 0 1px rgba(0,0,0,0.08), 0 10px 40px rgba(0,0,0,0.05)",
      }}
    >
      {/* Front Camera */}
      <div style={{ position: "absolute", left: "50%", top: "1.25em", transform: "translateX(-50%)", width: "1em", height: "1em", borderRadius: "50%", backgroundColor: isDark ? "#000" : "#222", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }} />
      
      {/* Hardware Buttons */}
      <div style={{ position: "absolute", right: "-2px", top: "10%", width: "2px", height: "5%", backgroundColor: bezelColor, borderTopRightRadius: "2px", borderBottomRightRadius: "2px" }} />
      <div style={{ position: "absolute", right: "-2px", top: "16%", width: "2px", height: "5%", backgroundColor: bezelColor, borderTopRightRadius: "2px", borderBottomRightRadius: "2px" }} />
      <div style={{ position: "absolute", left: "10%", top: "-2px", width: "5%", height: "2px", backgroundColor: bezelColor, borderTopLeftRadius: "2px", borderTopRightRadius: "2px" }} />

      <div
        style={{
          display: "flex",
          width: "100%",
          overflow: "hidden",
          backgroundColor: innerBg,
          position: "relative",
          borderRadius: `calc(max(0px, ${borderRadius}px - 3.5em) * var(--frame-scale, 1))`,
          ...(imageAspectRatio ? { aspectRatio: String(imageAspectRatio) } : {}),
        }}
      >
        {children}
      </div>
    </div>
  );
}
