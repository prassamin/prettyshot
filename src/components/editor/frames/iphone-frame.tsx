import { FrameProps } from "./types";

export function IphoneFrame({ children, style, borderRadius, className, imageAspectRatio, theme = "light" }: FrameProps) {
  const isDark = theme === "dark";
  const bezelColor = isDark ? "#121212" : "#E5E5EA";
  const innerBg = isDark ? "#000" : "#fff";

  return (
    <div
      className={className}
      style={{
        ...style,
        backgroundColor: bezelColor,
        padding: "3.8em",
        position: "relative",
        display: "flex",
        boxShadow: isDark ? "inset 0 0 0 1px rgba(255,255,255,0.1), 0 10px 40px rgba(0,0,0,0.5)" : "inset 0 0 0 1px rgba(0,0,0,0.1), 0 10px 40px rgba(0,0,0,0.1)",
      }}
    >
      {/* Hardware Buttons */}
      <div style={{ position: "absolute", left: "-2px", top: "20%", width: "2px", height: "10%", backgroundColor: bezelColor, borderTopLeftRadius: "2px", borderBottomLeftRadius: "2px" }} />
      <div style={{ position: "absolute", left: "-2px", top: "35%", width: "2px", height: "10%", backgroundColor: bezelColor, borderTopLeftRadius: "2px", borderBottomLeftRadius: "2px" }} />
      <div style={{ position: "absolute", right: "-2px", top: "30%", width: "2px", height: "15%", backgroundColor: bezelColor, borderTopRightRadius: "2px", borderBottomRightRadius: "2px" }} />

      <div
        style={{
          display: "flex",
          width: "100%",
          overflow: "hidden",
          backgroundColor: innerBg,
          position: "relative",
          borderRadius: `calc(max(0px, ${borderRadius}px - 3.8em) * var(--frame-scale, 1))`,
          ...(imageAspectRatio ? { aspectRatio: String(imageAspectRatio) } : {}),
        }}
      >
        {/* Dynamic Island */}
        <div style={{
          position: "absolute",
          top: "2.5em",
          left: "50%",
          transform: "translateX(-50%)",
          width: "32%",
          height: "8.9em",
          backgroundColor: "#000",
          borderRadius: "4.5em",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 0.4em",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)"
        }}>
        </div>
        
        {children}
      </div>
    </div>
  );
}
