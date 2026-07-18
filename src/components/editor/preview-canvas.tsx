"use client";

import { useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Minus, Square, X } from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";
import { useAppStore } from "@/stores/app-store";
import { SHADOW_PRESETS } from "@/lib/presets";
import { UploadZone } from "./upload-zone";
import { isPro } from "@/lib/utils";

function DeviceFrameWrapper({
  frame,
  children,
  style,
  borderRadius,
  className,
}: {
  frame: "none" | "macos" | "windows" | "glass";
  children: React.ReactNode;
  style: React.CSSProperties;
  borderRadius: number;
  className?: string;
}) {
  if (frame === "macos") {
    return (
      <div
        className={className}
        style={{
          ...style,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            gap: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#ff5f56",
              border: "1px solid #e0443e",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#ffbd2e",
              border: "1px solid #dea123",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#27c93f",
              border: "1px solid #1aab29",
            }}
          />
        </div>
        <div
          style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}
        >
          {children}
        </div>
      </div>
    );
  }

  if (frame === "windows") {
    return (
      <div
        className={className}
        style={{
          ...style,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            backgroundColor: "#f3f3f3",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            zIndex: 10,
          }}
        >
          <div style={{ padding: "10px 16px", color: "#666" }}>
            <Minus className="size-3.5" />
          </div>
          <div style={{ padding: "10px 16px", color: "#666" }}>
            <Square className="size-3" />
          </div>
          <div style={{ padding: "10px 16px", color: "#666" }}>
            <X className="size-4" />
          </div>
        </div>
        <div
          style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}
        >
          {children}
        </div>
      </div>
    );
  }

  if (frame === "glass") {
    return (
      <div
        className={className}
        style={{
          ...style,
          overflow: "hidden",
          display: "flex",
          padding: "16px",
          backgroundColor: "rgba(255, 255, 255, 0.25)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            overflow: "hidden",
            borderRadius: Math.max(0, borderRadius - 16),
            border: "1px solid rgba(255,255,255,0.4)",
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ ...style, overflow: "hidden", display: "flex" }}
    >
      {children}
    </div>
  );
}

/** Generate a tileable noise texture as a base64 PNG data URL */
function generateNoiseTexture(size = 150): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export function PreviewCanvas() {
  const captureRef = useRef<HTMLDivElement>(null);
  const { user } = useAppStore();
  const pro = isPro(user);

  const {
    image,
    bgType,
    bgGradient,
    bgMesh,
    bgSolid,
    bgImage,
    padding,
    borderRadius,
    borderWidth,
    borderColor,
    deviceFrame,
    shadowPreset,
    shadowColor,
    aspectRatio,
    noiseOpacity,
    rotateX,
    rotateY,
    rotateZ,
    showWatermark,
    watermarkText,
    watermarkPosition,
    watermarkSize,
  } = useEditorStore();

  const hasPerspective = rotateX !== 0 || rotateY !== 0 || rotateZ !== 0;

  const shadowTemplate =
    SHADOW_PRESETS.find((s) => s.name === shadowPreset)?.style ?? "none";
  const shadow =
    shadowTemplate === "none"
      ? "none"
      : shadowTemplate.replace(/\{color\}/g, shadowColor);

  const noiseDataUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return generateNoiseTexture();
  }, []);

  /* ─── background ─── */
  const bgStyle: React.CSSProperties = {};
  let bgClassName = "";

  if (bgType === "gradient") {
    bgClassName = bgGradient;
  } else if (bgType === "mesh" && bgMesh) {
    bgStyle.backgroundImage = `url(${bgMesh})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  } else if (bgType === "solid") {
    bgStyle.backgroundColor = bgSolid;
  } else if ((bgType === "image" || bgType === "custom") && bgImage) {
    bgStyle.backgroundImage = `url(${bgImage})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex h-full w-full min-h-0 min-w-0 items-center justify-center p-6 select-none"
    >
      {/* Capture area — exported via html-to-image */}
      <div
        ref={captureRef}
        id="capture-area"
        className={`relative flex flex-col items-center justify-center ${bgClassName}`}
        style={{
          ...bgStyle,
          padding: `${padding}px`,
          ...(aspectRatio
            ? {
                aspectRatio: `${aspectRatio}`,
                maxWidth: "100%",
                maxHeight: "100%",
              }
            : { maxWidth: "100%", maxHeight: "100%" }),
          width: "fit-content",
          height: "fit-content",
          minWidth: 0,
          minHeight: 0,
          ...(hasPerspective ? { perspective: "800px" } : {}),
        }}
      >
        {/* Noise overlay — behind content, only on background */}
        {noiseOpacity > 0 && noiseDataUrl && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              zIndex: 0,
              opacity: noiseOpacity / 100,
              backgroundImage: `url(${noiseDataUrl})`,
              backgroundRepeat: "repeat",
              backgroundSize: "150px 150px",
              mixBlendMode: "overlay",
            }}
          />
        )}

        {/* Screenshot image or Upload Dropzone */}
        {image ? (
          <DeviceFrameWrapper
            frame={deviceFrame}
            borderRadius={borderRadius}
            style={{
              position: "relative",
              zIndex: 1,
              borderRadius: `${borderRadius}px`,
              border:
                borderWidth > 0
                  ? `${borderWidth}px solid ${borderColor}`
                  : undefined,
              boxShadow: shadow,
              maxWidth: "100%",
              maxHeight: "100%",
              flexShrink: 1,
              ...(hasPerspective
                ? {
                    transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
                  }
                : {}),
            }}
          >
            <img
              src={image}
              alt="Screenshot"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "contain",
                minWidth: 0,
                minHeight: 0,
              }}
              draggable={false}
            />
          </DeviceFrameWrapper>
        ) : (
          <DeviceFrameWrapper
            frame={deviceFrame}
            borderRadius={borderRadius}
            className="w-[60vw] lg:w-[25vw]"
            style={{
              position: "relative",
              zIndex: 1,
              minHeight: aspectRatio ? "0" : "30vh",
              height: aspectRatio ? "100%" : "auto",
              alignSelf: "stretch",
              borderRadius: `${borderRadius}px`,
              border:
                borderWidth > 0
                  ? `${borderWidth}px solid ${borderColor}`
                  : undefined,
              boxShadow: shadow,
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(12px)",
              ...(hasPerspective
                ? {
                    transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
                  }
                : {}),
            }}
          >
            <div
              style={{ display: "flex", flex: 1, minWidth: 0, minHeight: 0 }}
            >
              <UploadZone />
            </div>
          </DeviceFrameWrapper>
        )}

        {/* Watermark — Forced on for Free users, toggleable/customizable for Pro */}
        {(!pro.isActive || showWatermark) && (
          <div
            className={`prettyshot-watermark-react absolute flex items-center gap-1 rounded-full px-2 py-0.5 ${
              watermarkPosition === "top-left"
                ? "top-3 left-3"
                : watermarkPosition === "top-right"
                  ? "top-3 right-3"
                  : watermarkPosition === "bottom-left"
                    ? "bottom-3 left-3"
                    : watermarkPosition === "center"
                      ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      : "bottom-3 right-3"
            }`}
            style={{
              backgroundColor: "rgba(0,0,0,0.25)",
              zIndex: 2,
              transform:
                watermarkPosition === "center"
                  ? `translate(-50%, -50%) scale(${watermarkSize / 100})`
                  : `scale(${watermarkSize / 100})`,
              transformOrigin:
                watermarkPosition === "center"
                  ? "center center"
                  : watermarkPosition.replace("-", " "),
            }}
          >
            <span
              className="font-semibold text-white"
              style={{ fontSize: "10px", lineHeight: "16px", opacity: 0.9 }}
            >
              {!pro.isActive ? "PrettyShot" : watermarkText || "PrettyShot"}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
