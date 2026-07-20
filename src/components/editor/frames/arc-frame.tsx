import { FrameProps } from "./types";

export function ArcFrame({ children, style, borderRadius, className, browserUrl, imageAspectRatio, theme = "light" }: FrameProps) {
  const isDark = theme === "dark";
  return (
    <div
      className={className}
      style={{
        ...style,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
      }}
    >
      {/* Arc Top Bar */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", height: "4em", padding: "0 1.2em" }}>
        {/* Left side (Traffic lights or window controls) */}
        <div style={{ position: "absolute", left: "1.2em", display: "flex", gap: "0.6em", alignItems: "center" }}>
           <svg width="1em" height="1em" viewBox="0 0 10 10" style={{ display: "block", overflow: "visible" }}>
             <circle cx="5" cy="5" r="5" fill="#ff5f56" />
           </svg>
           <svg width="1em" height="1em" viewBox="0 0 10 10" style={{ display: "block", overflow: "visible" }}>
             <circle cx="5" cy="5" r="5" fill="#ffbd2e" />
           </svg>
           <svg width="1em" height="1em" viewBox="0 0 10 10" style={{ display: "block", overflow: "visible" }}>
             <circle cx="5" cy="5" r="5" fill="#27c93f" />
           </svg>
        </div>
        
        {/* Center URL Bar */}
        {browserUrl && (
          <div style={{ 
            padding: "0.4em 4em", 
            borderRadius: "0.6em", 
            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)", 
            fontSize: "1.1em", 
            color: isDark ? "#aaa" : "#666", 
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "calc(100% - 10em)", // prevent overlapping with absolute items
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis"
          }}>
            {browserUrl}
          </div>
        )}
      </div>

      {/* Arc Lower Area */}
      <div style={{ display: "flex", padding: "0 0.8em 0.8em 0.8em", gap: "0.8em", minHeight: 0 }}>
        {/* Sidebar Mockup */}
        <div style={{ width: "4.4em", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2em", opacity: 0.8 }}>
          <div style={{ width: "3.2em", height: "3.2em", borderRadius: "0.8em", backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)", marginTop: "0.4em" }} />
          <div style={{ width: "3.2em", height: "3.2em", borderRadius: "0.8em", backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)" }} />
          <div style={{ width: "3.2em", height: "3.2em", borderRadius: "0.8em", backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)" }} />
        </div>
        
        {/* Main Viewport Content */}
        <div
          style={{
            display: "flex",
            overflow: "hidden",
            backgroundColor: isDark ? "#000" : "#fff",
            ...(imageAspectRatio ? { aspectRatio: String(imageAspectRatio) } : {}),
            borderRadius: `calc(max(0px, ${borderRadius}px - 8px) * var(--frame-scale, 1))`,
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
