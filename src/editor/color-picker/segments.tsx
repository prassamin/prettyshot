"use client";

import Color from "color";
import { PipetteIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@heroui/react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/tooltip";

type ColorPickerContextValue = {
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
  setHue: (hue: number) => void;
  setSaturation: (saturation: number) => void;
  setLightness: (lightness: number) => void;
  setAlpha: (alpha: number) => void;
};

const ColorPickerContext = createContext<ColorPickerContextValue | undefined>(
  undefined,
);

export const useColorPickerPrimitive = () => {
  const context = useContext(ColorPickerContext);
  if (!context) {
    throw new Error("useColorPicker must be used within a ColorPickerProvider");
  }
  return context;
};

export type ColorPickerPrimitiveProps = HTMLAttributes<HTMLDivElement> & {
  value?: Parameters<typeof Color>[0];
  defaultValue?: Parameters<typeof Color>[0];
  onChange?: (value: Parameters<typeof Color.rgb>[0]) => void;
};

export const ColorPickerPrimitive = ({
  value,
  defaultValue = "#000000",
  onChange,
  className,
  ...props
}: ColorPickerPrimitiveProps) => {
  const initialColor = Color(value || defaultValue);
  const [h = 0, s = 0, l = 50] = initialColor.hsl().array();

  const [hue, setHue] = useState(Number.isNaN(h) ? 0 : h);
  const [saturation, setSaturation] = useState(Number.isNaN(s) ? 0 : s);
  const [lightness, setLightness] = useState(Number.isNaN(l) ? 0 : l);
  const [alpha, setAlpha] = useState(initialColor.alpha() * 100);

  useEffect(() => {
    if (value) {
      try {
        const color = Color(value);
        const [newH = 0, newS = 0, newL = 50] = color.hsl().array();
        setHue(Number.isNaN(newH) ? 0 : newH);
        setSaturation(Number.isNaN(newS) ? 0 : newS);
        setLightness(Number.isNaN(newL) ? 0 : newL);
        setAlpha(color.alpha() * 100);
      } catch {}
    }
  }, [value]);

  useEffect(() => {
    if (onChange) {
      const color = Color.hsl(hue, saturation, lightness).alpha(alpha / 100);
      const rgba = color.rgb().array();
      onChange([rgba[0], rgba[1], rgba[2], alpha / 100]);
    }
  }, [hue, saturation, lightness, alpha, onChange]);

  return (
    <ColorPickerContext.Provider
      value={{
        hue,
        saturation,
        lightness,
        alpha,
        setHue,
        setSaturation,
        setLightness,
        setAlpha,
      }}
    >
      <div
        className={cn("flex size-full flex-col gap-4", className)}
        {...props}
      />
    </ColorPickerContext.Provider>
  );
};

export const ColorPickerGridPrimitive = ({
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { hue, saturation, lightness, setSaturation, setLightness } =
    useColorPickerPrimitive();

  const maxLightness = saturation < 1 ? 100 : 50 + 50 * (1 - saturation / 100);
  const positionX = saturation / 100;
  const positionY = maxLightness > 0 ? 1 - lightness / maxLightness : 0;

  const backgroundGradient = useMemo(() => {
    return `linear-gradient(0deg, rgba(0,0,0,1), rgba(0,0,0,0)),
            linear-gradient(90deg, rgba(255,255,255,1), rgba(255,255,255,0)),
            hsl(${hue}, 100%, 50%)`;
  }, [hue]);

  const handlePointer = useCallback(
    (event: React.PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(
        0,
        Math.min(1, (event.clientX - rect.left) / rect.width),
      );
      const y = Math.max(
        0,
        Math.min(1, (event.clientY - rect.top) / rect.height),
      );
      setSaturation(x * 100);
      const topLightness = x < 0.01 ? 100 : 50 + 50 * (1 - x);
      setLightness(topLightness * (1 - y));
    },
    [setSaturation, setLightness],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative size-full cursor-crosshair rounded-[2px] shadow-sm",
        className,
      )}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDragging(true);
        handlePointer(e);
      }}
      onPointerMove={(e) => {
        if (isDragging) handlePointer(e);
      }}
      onPointerUp={(e) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      style={{
        background: backgroundGradient,
        touchAction: "none",
        ...style,
      }}
      {...props}
    >
      <div
        className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-transparent"
        style={{
          left: `${positionX * 100}%`,
          top: `${positionY * 100}%`,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
};

// --- Custom Sliders to avoid Popover pointer blocking issues ---

function CustomSlider({
  value,
  max,
  onChange,
  bg,
  thumbColor = "white",
  className,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  bg: string;
  thumbColor?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const positionX = value / max;

  const handlePointer = useCallback(
    (event: React.PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(
        0,
        Math.min(1, (event.clientX - rect.left) / rect.width),
      );
      onChange(x * max);
    },
    [max, onChange],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-2.5 w-full cursor-pointer rounded-full",
        className,
      )}
      style={{ background: bg, touchAction: "none" }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDragging(true);
        handlePointer(e);
      }}
      onPointerMove={(e) => {
        if (isDragging) handlePointer(e);
      }}
      onPointerUp={(e) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
    >
      <div
        className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.2)]"
        style={{
          left: `${positionX * 100}%`,
          backgroundColor: thumbColor,
        }}
      />
    </div>
  );
}

export const ColorPickerHuePrimitive = ({
  className,
}: {
  className?: string;
}) => {
  const { hue, setHue } = useColorPickerPrimitive();
  return (
    <CustomSlider
      value={hue}
      max={360}
      onChange={setHue}
      bg="linear-gradient(90deg, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)"
      className={className}
      thumbColor={`hsl(${hue}, 100%, 50%)`}
    />
  );
};

export const ColorPickerOpacityPrimitive = ({
  className,
}: {
  className?: string;
}) => {
  const { hue, saturation, lightness, alpha, setAlpha } =
    useColorPickerPrimitive();
  const baseColor = Color.hsl(hue, saturation, lightness).hex();
  return (
    <div className={cn("relative h-2.5 rounded-full shadow-inner", className)}>
      <div className="absolute inset-0 rounded-full bg-[repeating-conic-gradient(#ccc_0%_25%,transparent_0%_50%)_50%/8px_8px] z-0" />
      <CustomSlider
        value={alpha}
        max={100}
        onChange={setAlpha}
        bg={`linear-gradient(90deg, transparent, ${baseColor})`}
        className="absolute inset-0 z-10 bg-transparent!"
      />
    </div>
  );
};

export const ColorPickerPickPrimitive = ({
  className,
  ...props
}: ComponentProps<typeof Button>) => {
  const { setHue, setSaturation, setLightness, setAlpha } =
    useColorPickerPrimitive();
  const isSupported = typeof window !== "undefined" && "EyeDropper" in window;

  const handleEyeDropper = async () => {
    if (!(window as any).EyeDropper) return;
    try {
      const result = await new (window as any).EyeDropper().open();
      const color = Color(result.sRGBHex);
      const [h = 0, s = 0, l = 0] = color.hsl().array();
      setHue(h);
      setSaturation(s);
      setLightness(l);
      setAlpha(100);
    } catch {}
  };

  if (!isSupported) return null;

  return (
    <Button
      {...props}
      type="button"
      className={cn(
        "flex items-center justify-center rounded transition-colors text-muted-foreground hover:text-foreground",
        className,
      )}
      onClick={handleEyeDropper}
    >
      <PipetteIcon size={16} />
    </Button>
  );
};

export const ColorPickerValuePrimitive = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const {
    hue,
    saturation,
    lightness,
    alpha,
    setHue,
    setSaturation,
    setLightness,
    setAlpha,
  } = useColorPickerPrimitive();
  const color = Color.hsl(hue, saturation, lightness, alpha / 100);
  const hex = color.hex().toUpperCase().replace("#", "");
  const [raw, setRaw] = useState(hex);

  const startX = useRef(0);
  const startVal = useRef(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  useEffect(() => {
    if (hex !== raw) setRaw(hex);
  }, [hex]);

  return (
    <div className={cn("flex w-full items-center gap-2", className)} {...props}>
      {/* Hex Input */}
      <div className="flex flex-1 items-center rounded-md border border-foreground/15 bg-foreground/5 hover:bg-foreground/10 focus-within:bg-foreground/10! focus-within:border-foreground/20! focus-within:ring-1 focus-within:ring-border/50 transition-all px-2.5 h-8">
        <span className="text-muted-foreground/70 select-none text-[11px] font-semibold mr-1.5">
          #
        </span>
        <input
          className="w-full bg-transparent text-foreground outline-none text-[11px] font-mono placeholder:text-muted-foreground uppercase"
          type="text"
          spellCheck={false}
          autoComplete="off"
          value={raw}
          onChange={(e) => {
            const v = e.target.value.replace(/^#/, "");
            setRaw(v);
            try {
              const c = Color(`#${v}`);
              const [h = 0, s = 0, l = 0, a = 1] = c.hsl().array();
              setHue(h);
              setSaturation(s);
              setLightness(l);
              if (a !== 1) setAlpha(a * 100);
            } catch {}
          }}
          onBlur={() => setRaw(hex)}
        />
      </div>

      {/* Alpha Input */}
      <div className="flex w-17 items-center rounded-md border border-foreground/15 bg-foreground/5 hover:bg-foreground/10 focus-within:bg-foreground/10! focus-within:border-foreground/20! focus-within:ring-1 focus-within:ring-border/50 transition-all px-2.5 h-8">
        <input
          className="w-full bg-transparent text-foreground outline-none text-[11px] font-mono text-right"
          type="text"
          value={Math.round(alpha)}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) setAlpha(Math.max(0, Math.min(100, v)));
          }}
        />
        <Tooltip content="Drag to scrub opacity">
          <span
            className="text-muted-foreground/70 hover:text-foreground cursor-ew-resize select-none text-[11px] font-semibold ml-1.5 p-0.5 -mr-0.5 rounded transition-colors"
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              startX.current = e.clientX;
              startVal.current = alpha;
              setIsScrubbing(true);
            }}
            onPointerMove={(e) => {
              if (!isScrubbing) return;
              const delta = (e.clientX - startX.current) * 0.8;
              setAlpha(Math.max(0, Math.min(100, startVal.current + delta)));
            }}
            onPointerUp={(e) => {
              setIsScrubbing(false);
              e.currentTarget.releasePointerCapture(e.pointerId);
            }}
          >
            %
          </span>
        </Tooltip>
      </div>
    </div>
  );
};
