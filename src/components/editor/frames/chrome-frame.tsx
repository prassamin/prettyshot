import { ArrowLeft, ArrowRight, RotateCw, Plus } from "lucide-react";
import { FrameProps } from "./types";

export function ChromeFrame({ children, style, borderRadius, className, browserUrl, imageAspectRatio, theme = "light" }: FrameProps) {
  const isDark = theme === "dark";
  const bg = isDark ? "#292A2D" : "#DEE1E6";
  const fg = isDark ? "#35363A" : "#FFFFFF";
  const text = isDark ? "#E8EAED" : "#3C4043";
  const iconColor = isDark ? "#9AA0A6" : "#5F6368";

  return (
    <div
      className={className}
      style={{
        ...style,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        backgroundColor: bg,
      }}
    >
      {/* Chrome Tab Bar */}
      <div style={{ boxSizing: "border-box", display: "flex", alignItems: "flex-end", height: "3em", padding: "0.4em 0.5em 0 0.5em", gap: "0.5em" }}>
        {/* Active Tab */}
        <div style={{ 
          backgroundColor: fg, 
          height: "100%", 
          width: "14em", 
          borderTopLeftRadius: "0.6em", 
          borderTopRightRadius: "0.6em",
          display: "flex",
          alignItems: "center",
          padding: "0 0.8em",
          gap: "0.6em"
        }}>
          <div style={{ width: "1.2em", height: "1.2em", borderRadius: "50%", backgroundColor: isDark ? "#5F6368" : "#E8EAED" }} />
          <div style={{ flex: 1, height: "0.4em", borderRadius: "0.2em", backgroundColor: isDark ? "#5F6368" : "#E8EAED" }} />
        </div>
        <div style={{ padding: "0.2em", color: iconColor, marginBottom: "0.2em" }}>
          <Plus style={{ width: "1.2em", height: "1.2em", display: "block" }} />
        </div>
      </div>

      {/* Chrome Address Bar */}
      <div style={{ boxSizing: "border-box", display: "flex", alignItems: "center", backgroundColor: fg, padding: "0 0.8em", gap: "0.8em", height: "3em", borderBottom: `1px solid ${isDark ? "#202124" : "#DADCE0"}` }}>
        <ArrowLeft style={{ width: "1.2em", height: "1.2em", color: iconColor }} />
        <ArrowRight style={{ width: "1.2em", height: "1.2em", color: iconColor, opacity: 0.4 }} />
        <RotateCw style={{ width: "1.2em", height: "1.2em", color: iconColor }} />
        
        <div style={{ 
          flex: 1, 
          backgroundColor: isDark ? "#202124" : "#F1F3F4", 
          borderRadius: "1em", 
          padding: "0.3em 1em",
          fontSize: "0.9em",
          color: text,
          display: "flex",
          alignItems: "center",
        }}>
          {browserUrl || "google.com"}
        </div>
      </div>
      
      {/* Main Viewport Content */}
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
