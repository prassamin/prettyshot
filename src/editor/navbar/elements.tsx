"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/tooltip";

export function NavbarButton({
  title,
  icon: Icon,
  shortcut,
  onPress,
  isDisabled,
  isActive,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  onPress?: () => void;
  isDisabled?: boolean;
  isActive?: boolean;
}) {
  return (
    <Tooltip
      content={
        <div className="flex items-center gap-2">
          {title}
          <kbd className="rounded bg-surface-muted px-1 font-mono text-sm tracking-[5] text-muted-foreground">
            {shortcut}
          </kbd>
        </div>
      }
      noDelay
    >
      <button
        type="button"
        aria-label={title}
        aria-disabled={isDisabled || undefined}
        onClick={isDisabled ? undefined : onPress}
        className={cn(
          "group relative inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-all duration-150",
          "hover:bg-surface-tertiary hover:text-foreground active:scale-95",
          isActive && "bg-surface-tertiary text-primary shadow-xs",
          isDisabled &&
            "cursor-not-allowed opacity-35 hover:bg-transparent hover:text-muted-foreground active:scale-100",
        )}
      >
        <Icon className="size-4 transition-transform duration-150 group-hover:scale-105" />
      </button>
    </Tooltip>
  );
}

export function NavbarActionButton({
  text,
  icon: Icon,
  variant = "ghost",
  onAction,
  isDisabled,
  className,
  children,
}: {
  text?: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "ghost" | "default" | "outline" | "secondary";
  onAction?: () => void;
  isDisabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={text}
      onClick={isDisabled ? undefined : onAction}
      aria-disabled={isDisabled || undefined}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all duration-150 select-none",
        variant === "default" &&
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:scale-95",
        variant === "secondary" &&
          "bg-surface-tertiary/60 text-foreground hover:bg-surface-tertiary active:scale-95",
        variant === "outline" &&
          "border border-border/80 bg-surface-secondary text-foreground hover:bg-surface-tertiary active:scale-95",
        variant === "ghost" &&
          "text-muted-foreground hover:bg-surface-tertiary hover:text-foreground active:scale-95",
        isDisabled &&
          "cursor-not-allowed opacity-40 active:scale-100 hover:bg-transparent",
        className,
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      {text && <span>{text}</span>}
      {children}
    </button>
  );
}

export function GroupToggleList<T extends string>({
  items,
  currentValue,
  onSelection,
  className,
}: {
  items: { id: T; label: string; badge?: string }[];
  currentValue: T;
  onSelection: (val: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-8 w-full items-center rounded-xl bg-surface-secondary p-1 border border-border/60 shadow-inner",
        className,
      )}
    >
      {items.map((opt) => {
        const active = currentValue === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelection(opt.id)}
            className={cn(
              "relative z-10 flex flex-1 items-center justify-center gap-1 rounded-lg py-1 px-2 text-[11px] font-medium transition-colors select-none",
              active
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.div
                layoutId="nav-toggle-bg"
                transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
                className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/15"
              />
            )}
            <span className="relative z-10">{opt.label}</span>
            {opt.badge && (
              <span className="relative z-10 rounded bg-primary/15 px-1 py-0.2 text-[9px] font-mono text-primary">
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ToggleListItem({
  title,
  subtext,
  isOn,
  onToggle,
  isDisabled,
}: {
  title: string;
  subtext?: string;
  isOn: boolean;
  onToggle: (state: boolean) => void;
  isDisabled?: boolean;
}) {
  return (
    <div
      onClick={() => !isDisabled && onToggle(!isOn)}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/70 bg-surface-secondary/70 p-2.5 transition-colors select-none",
        "hover:bg-surface-tertiary/70",
        isDisabled && "cursor-not-allowed opacity-50",
      )}
    >
      <div className="space-y-0.5">
        <div className="text-xs font-medium text-foreground">{title}</div>
        {subtext && (
          <div className="text-[11px] text-muted-foreground">{subtext}</div>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        disabled={isDisabled}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none",
          isOn
            ? "border-transparent bg-primary"
            : "border-transparent bg-surface-tertiary-foreground/25 shadow-inner ring-1 ring-border/60",
          isDisabled && "cursor-not-allowed",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block size-4 transform rounded-full bg-popover-foreground shadow-md ring-0 transition duration-200 ease-in-out",
            isOn ? "translate-x-4" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

export function RadioCard({
  title,
  desc,
  selected,
  onClick,
}: {
  title: string;
  desc?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full group relative flex flex-col items-center justify-center rounded-[10px] p-2.5 text-center transition-all duration-200 select-none overflow-hidden border",
        selected
          ? "bg-primary/10 ring-1 ring-primary/25 border-transparent"
          : "bg-surface-tertiary/60 border-border/40 hover:bg-surface-tertiary/80 hover:border-border",
      )}
    >
      {selected && (
        <div className="absolute inset-0 bg-linear-to-br from-primary/40 to-transparent opacity-40" />
      )}
      <span
        className={cn(
          "relative z-10 text-[11px] font-bold tracking-wide transition-colors",
          selected
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        {title}
      </span>
      {desc && (
        <span
          className={cn(
            "relative z-10 text-[9px] font-medium transition-colors",
            selected
              ? "text-primary/70"
              : "text-muted-foreground/70 group-hover:text-muted-foreground",
          )}
        >
          {desc}
        </span>
      )}
    </button>
  );
}
