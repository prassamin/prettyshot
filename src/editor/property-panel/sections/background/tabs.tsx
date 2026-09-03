/**
 * Background section — background type tabs (None / Auto / Solid / Gradient).
 */

import * as React from "react";
import { Tabs } from "@heroui/react";

import { Tooltip } from "@/components/tooltip";
import { TransparencyIcon } from "@/components/icons/transparency";
import { cn } from "@/lib/utils";
import type { BgType } from "./types";
import { Blend, Image, Palette, Wand } from "lucide-react";
import { Mesh } from "@/components/icons/mesh";

const TABS: {
  id: BgType;
  tooltip: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "none", tooltip: "Transparent", icon: TransparencyIcon },
  { id: "auto", tooltip: "Auto generated gradient", icon: Wand },
  { id: "solid", tooltip: "Solid color", icon: Palette },
  { id: "gradient", tooltip: "Gradient", icon: Blend },
  { id: "mesh", tooltip: "Mesh gradient", icon: Mesh },
  { id: "image", tooltip: "Image", icon: Image },
];

const listClassName = [
  "mb-4 w-full rounded-lg bg-foreground/4 p-1",
  "**:data-[slot=tabs-tab]:h-7",
  "**:data-[slot=tabs-tab]:flex-1",
  "**:data-[slot=tabs-tab]:rounded-md",
  "**:data-[slot=tabs-tab]:px-1",
  "**:data-[slot=tabs-tab]:text-[11px]",
  "**:data-[slot=tabs-tab]:font-medium",
  "**:data-[slot=tabs-tab]:data-[selected=true]:font-semibold",
  "**:data-[slot=tabs-indicator]:rounded-md",
  "**:data-[slot=tabs-indicator]:bg-background",
  "**:data-[slot=tabs-indicator]:shadow-xs",
  "**:data-[slot=tabs-indicator]:ring-1",
  "**:data-[slot=tabs-indicator]:ring-border/60",
].join(" ");

export function BackgroundTypeTabs({
  value,
  onChange,
}: {
  value: BgType;
  onChange: (type: BgType) => void;
}) {
  return (
    <Tabs
      selectedKey={value}
      onSelectionChange={(key) => onChange(key as BgType)}
      className="w-full"
    >
      <Tabs.ListContainer>
        <Tabs.List aria-label="Background type" className={listClassName}>
          {TABS.map((tab) => (
            <Tabs.Tab key={tab.id} id={tab.id}>
              <Tooltip content={tab.tooltip} placement="bottom" showArrow delay={0}>
                <span className="flex items-center justify-center">
                  <tab.icon className={cn("size-3.5", value === tab.id ? "text-primary" : "text-muted-foreground")} />
                </span>
              </Tooltip>
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}
