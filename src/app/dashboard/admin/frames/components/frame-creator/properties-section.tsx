"use client";

import { Check, RotateCw, Star, ChevronDown } from "lucide-react";
import { Dropdown, Button, Label, Switch } from "@heroui/react";
import { cn } from "@/lib/utils";
import type { FrameCreatorState } from "./use-frame-creator";
import type { FrameKind } from "@/editor/property-panel/sections/frame/types";

export function PropertiesSection({ ctx }: { ctx: FrameCreatorState }) {
  const {
    isFree,
    setIsFree,
    supportsOrientation,
    setSupportsOrientation,
    kind,
    setKind,
  } = ctx;

  return (
    <div className="rounded-2xl border border-border/40 bg-background p-4 shadow-inner flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-semibold text-foreground">
          Properties
        </span>
      </div>

      <div className="space-y-4">
        {/* Frame Kind */}
        <div className="space-y-2">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Frame Kind
          </label>
          <Dropdown>
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm font-medium text-foreground"
            >
              <span className="capitalize">{kind}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu onAction={(key) => setKind(key as FrameKind)}>
                <Dropdown.Item id="phone" textValue="Phone">
                  <Label>Phone</Label>
                </Dropdown.Item>
                <Dropdown.Item id="tablet" textValue="Tablet">
                  <Label>Tablet</Label>
                </Dropdown.Item>
                <Dropdown.Item id="desktop" textValue="Desktop">
                  <Label>Desktop</Label>
                </Dropdown.Item>
                <Dropdown.Item id="laptop" textValue="Laptop">
                  <Label>Laptop</Label>
                </Dropdown.Item>
                <Dropdown.Item id="ereader" textValue="E-Reader">
                  <Label>E-Reader</Label>
                </Dropdown.Item>
                <Dropdown.Item id="tv" textValue="TV / Display">
                  <Label>TV / Display</Label>
                </Dropdown.Item>
                <Dropdown.Item id="browser" textValue="Browser">
                  <Label>Browser</Label>
                </Dropdown.Item>
                <Dropdown.Item id="watch" textValue="Watch">
                  <Label>Watch</Label>
                </Dropdown.Item>
                <Dropdown.Item id="none" textValue="None">
                  <Label>None</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>

        {/* Orientation & Pricing */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border/20">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 mt-2">
            Configuration
          </label>

          <div className="rounded-xl border border-border/40 bg-background/50 hover:bg-background transition-colors px-3 py-2.5 flex">
            <Switch
              isSelected={supportsOrientation}
              onChange={setSupportsOrientation}
              className="w-full flex-row-reverse justify-between"
            >
              <Switch.Control
                className={
                  supportsOrientation ? "bg-primary" : "bg-foreground/15"
                }
              >
                <Switch.Thumb>
                  <Switch.Icon>
                    <RotateCw className="size-3 text-foreground" />
                  </Switch.Icon>
                </Switch.Thumb>
              </Switch.Control>
              <Switch.Content className="flex flex-col gap-0.5 items-start">
                <Label className="text-[12.5px] font-medium text-foreground cursor-pointer">
                  Rotatable
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  Supports landscape mode
                </span>
              </Switch.Content>
            </Switch>
          </div>

          <div
            className={cn(
              "rounded-xl border transition-colors px-3 py-2.5 flex",
              !isFree
                ? "border-warning/30 bg-warning/5 hover:bg-warning/10"
                : "border-border/40 bg-background/50 hover:bg-background",
            )}
          >
            <Switch
              isSelected={!isFree}
              onChange={(val) => setIsFree(!val)}
              className="w-full flex-row-reverse justify-between"
            >
              <Switch.Control
                className={!isFree ? "bg-warning" : "bg-foreground/15"}
              >
                <Switch.Thumb>
                  <Switch.Icon>
                    {!isFree ? (
                      <Star className="size-3 text-warning" />
                    ) : (
                      <Check className="size-3 text-success" />
                    )}
                  </Switch.Icon>
                </Switch.Thumb>
              </Switch.Control>
              <Switch.Content className="flex flex-col gap-0.5 items-start">
                <Label className="text-[12.5px] font-medium text-foreground cursor-pointer">
                  Premium Mode
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  Requires a pro subscription
                </span>
              </Switch.Content>
            </Switch>
          </div>
        </div>
      </div>
    </div>
  );
}
