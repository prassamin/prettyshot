"use client";

import { useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";
import { SHADOW_PRESETS } from "@/lib/presets";

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

  const image = useEditorStore((s) => s.image);
  const bgType = useEditorStore((s) => s.bgType);
  const bgGradient = useEditorStore((s) => s.bgGradient);
  const bgMesh = useEditorStore((s) => s.bgMesh);
  const bgSolid = useEditorStore((s) => s.bgSolid);
  const bgImage = useEditorStore((s) => s.bgImage);
  const padding = useEditorStore((s) => s.padding);
  const borderRadius = useEditorStore((s) => s.borderRadius);
  const shadowPreset = useEditorStore((s) => s.shadowPreset);
  const shadowColor = useEditorStore((s) => s.shadowColor);
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const noiseOpacity = useEditorStore((s) => s.noiseOpacity);
  const rotateX = useEditorStore((s) => s.rotateX);
  const rotateY = useEditorStore((s) => s.rotateY);
  const rotateZ = useEditorStore((s) => s.rotateZ);

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
  } else if (bgType === "image" && bgImage) {
    bgStyle.backgroundImage = `url(${bgImage})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex h-full w-full items-center justify-center p-6 select-none"
    >
      {/* Capture area — exported via html-to-image */}
      <div
        ref={captureRef}
        id="capture-area"
        className={`relative flex items-center justify-center ${bgClassName}`}
        style={{
          ...bgStyle,
          padding: `${padding}px`,
          ...(aspectRatio
            ? { aspectRatio: `${aspectRatio}`, maxWidth: "100%", maxHeight: "100%" }
            : { maxWidth: "100%", maxHeight: "100%" }),
          width: "fit-content",
          height: "fit-content",
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

        {/* Screenshot image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image ?? ""}
          alt="Screenshot"
          style={{
            display: "block",
            borderRadius: `${borderRadius}px`,
            boxShadow: shadow,
            maxWidth: "100%",
            maxHeight: "100%",
            position: "relative",
            zIndex: 1,
            ...(hasPerspective
              ? { transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)` }
              : {}),
          }}
          draggable={false}
        />

        {/* PrettyShot watermark — always present */}
        <div
          className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full px-2 py-0.5"
          style={{ backgroundColor: "rgba(0,0,0,0.25)", zIndex: 2 }}
        >
          <Sparkles
            className="text-white"
            style={{ width: "10px", height: "10px" }}
            strokeWidth={2.5}
          />
          <span
            className="font-semibold text-white"
            style={{ fontSize: "10px", lineHeight: "16px", opacity: 0.9 }}
          >
            PrettyShot
          </span>
        </div>
      </div>
    </motion.div>
  );
}
