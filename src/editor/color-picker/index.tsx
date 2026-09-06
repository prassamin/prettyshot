"use client";

import * as React from "react";
import Color from "color";

import {
  ColorPickerPrimitive,
  ColorPickerGridPrimitive,
  ColorPickerHuePrimitive,
  ColorPickerOpacityPrimitive,
  ColorPickerPickPrimitive,
  ColorPickerValuePrimitive,
} from "./segments";
import { Popover } from "@heroui/react";
import { Placement } from "@/types/heroui";

type Props = {
  value?: string;
  onChange: (hex: string) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  placement?: Placement;
};

export function ColorPicker({
  value,
  onChange,
  children,
  footer,
  placement = "top",
}: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover isOpen={open} onOpenChange={setOpen}>
      <Popover.Trigger>{children}</Popover.Trigger>
      <Popover.Content
        placement={placement}
        containerPadding={12}
        className="w-64 overflow-hidden rounded-2xl bg-surface-secondary/95 backdrop-blur-xl border border-border shadow-2xl p-3 text-foreground focus-visible:outline-none z-50 *:select-none"
      >
        <div className="flex flex-col gap-3 w-full">
          <PickerBody initial={value || "#000000"} onChange={onChange} />
          {footer && (
            <div className="border-t border-border pt-3 mt-1">{footer}</div>
          )}
        </div>
      </Popover.Content>
    </Popover>
  );
}

function PickerBody({
  initial,
  onChange,
}: {
  initial: string;
  onChange: (hex: string) => void;
}) {
  const changeRef = React.useRef(onChange);
  React.useEffect(() => {
    changeRef.current = onChange;
  });

  const skipFirst = React.useRef(true);

  const stableOnChange = React.useCallback((rgba: unknown) => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const [r, g, b, a] = rgba as number[];
    try {
      const c = Color.rgb(r, g, b).alpha(a);
      const hex = a < 1 ? c.hexa() : c.hex();
      changeRef.current(hex);
    } catch {}
  }, []);

  return (
    <ColorPickerPrimitive
      defaultValue={initial}
      onChange={stableOnChange}
      className="gap-3"
    >
      <ColorPickerGridPrimitive className="h-40" />
      <div className="flex items-center gap-3 mt-1">
        <ColorPickerPickPrimitive className="size-6 text-muted-foreground hover:bg-secondary bg-transparent border-none rounded shadow-none shrink-0" />
        <div className="flex flex-1 flex-col gap-2.5">
          <ColorPickerHuePrimitive />
          <ColorPickerOpacityPrimitive />
        </div>
      </div>
      <div className="mt-0.5">
        <ColorPickerValuePrimitive />
      </div>
    </ColorPickerPrimitive>
  );
}
