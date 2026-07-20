"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DeviceFrameWrapper } from "./frames";
import { useEditorStore } from "@/stores/editor-store";
import { useAppStore } from "@/stores/app-store";
import { SHADOW_PRESETS } from "@/lib/presets";
import { UploadZone } from "./upload-zone";
import { isPro } from "@/lib/utils";

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
  const frameRef = useRef<HTMLDivElement>(null);
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
    frameTheme,
    browserUrl,
    shadowPreset,
    shadowColor,
    aspectRatio: customAspectRatio,
    noiseOpacity,
    rotateX,
    rotateY,
    rotateZ,
    showWatermark,
    watermarkText,
    watermarkPosition,
    watermarkSize,
  } = useEditorStore();

  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  const frameAspectRatio = useMemo(() => {
    if (!imageAspectRatio) return null;
    if (deviceFrame === "none") return imageAspectRatio;
    if (deviceFrame === "macos") {
      // 3.6em exact height
      return 1 / (1 / imageAspectRatio + 0.036);
    }
    if (deviceFrame === "windows") {
      // 3.6em exact height
      return 1 / (1 / imageAspectRatio + 0.036);
    }
    if (deviceFrame === "chrome") {
      // Tab bar (3.0em) + Address bar (3.0em) = 6.0em
      return 1 / (1 / imageAspectRatio + 0.06);
    }
    if (deviceFrame === "minimal") {
      // Top bar (2.4em)
      return 1 / (1 / imageAspectRatio + 0.024);
    }
    if (deviceFrame === "arc") {
      return 1 / (0.932 / imageAspectRatio + 0.048);
    }
    if (deviceFrame === "glass") {
      return 1 / (0.968 / imageAspectRatio + 0.032);
    }
    if (deviceFrame === "iphone") {
      // Always force a modern phone aspect ratio to prevent it from looking like a tablet
      return 9 / 19.5;
    }
    if (deviceFrame === "tablet") {
      // Classic tablet aspect ratio, orientation based on the image
      return imageAspectRatio > 1 ? 4 / 3 : 3 / 4;
    }
    return imageAspectRatio;
  }, [imageAspectRatio, deviceFrame]);

  useEffect(() => {
    if (!frameRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        // Base width of 1000px = scale 1
        const scale = width / 1000;

        // Set variables on captureRef so siblings (like watermark) can use them
        if (captureRef.current) {
          captureRef.current.style.setProperty(
            "--frame-scale",
            scale.toString(),
          );
        }

        // Set fontSize on the frame itself so em units scale relative to frame width
        (entry.target as HTMLElement).style.fontSize = `${10 * scale}px`;
      }
    });
    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, []);

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
          ...(customAspectRatio
            ? {
                aspectRatio: `${customAspectRatio}`,
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

        {/* Wrapper for the frame so we can accurately measure its width without padding */}
        <div
          ref={frameRef}
          className={!image ? "w-[60vw] lg:w-[25vw]" : ""}
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "100%",
            maxHeight: "100%",
            flexShrink: 1,
            display: "flex",
            ...(image && frameAspectRatio
              ? { aspectRatio: String(frameAspectRatio) }
              : {}),
            ...(!image
              ? {
                  minHeight: customAspectRatio ? "0" : "30vh",
                  height: customAspectRatio ? "100%" : "auto",
                  alignSelf: "stretch",
                }
              : {}),
            ...(hasPerspective
              ? {
                  transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
                }
              : {}),
          }}
        >
          {/* Screenshot image or Upload Dropzone */}
          {image ? (
            <DeviceFrameWrapper
              frame={deviceFrame}
              borderRadius={borderRadius}
              browserUrl={browserUrl}
              theme={frameTheme}
              imageAspectRatio={imageAspectRatio}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: `calc(${borderRadius}px * var(--frame-scale, 1))`,
                border:
                  borderWidth > 0
                    ? `calc(${borderWidth}px * var(--frame-scale, 1)) solid ${borderColor}`
                    : undefined,
                boxShadow: shadow,
              }}
            >
              <img
                src={image}
                alt="Screenshot"
                onLoad={(e) =>
                  setImageAspectRatio(
                    e.currentTarget.naturalWidth /
                      e.currentTarget.naturalHeight,
                  )
                }
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit:
                    deviceFrame === "iphone" || deviceFrame === "tablet"
                      ? "cover"
                      : "contain",
                }}
                draggable={false}
              />
            </DeviceFrameWrapper>
          ) : (
            <DeviceFrameWrapper
              frame={deviceFrame}
              borderRadius={borderRadius}
              browserUrl={browserUrl}
              theme={frameTheme}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: `${borderRadius}px`,
                border:
                  borderWidth > 0
                    ? `${borderWidth}px solid ${borderColor}`
                    : undefined,
                boxShadow: shadow,
                backgroundColor: "rgba(255, 255, 255, 0.6)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                style={{ display: "flex", flex: 1, minWidth: 0, minHeight: 0 }}
              >
                <UploadZone />
              </div>
            </DeviceFrameWrapper>
          )}
        </div>

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
