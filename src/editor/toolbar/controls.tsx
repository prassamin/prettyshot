"use client";

import * as React from "react";
import { Copy, Trash } from "lucide-react";

import { Popover } from "@heroui/react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/tooltip";
import { Placement } from "@/types/heroui";
import { useControllableState } from "@/hooks/use-controllable-state";

export function computeToolbarOffset(flipBelow: boolean, scale = 1) {
  const placement = flipBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)";
  return scale === 1 ? placement : `${placement} scale(${scale})`;
}

export function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-foreground/10 sm:mx-1" />;
}

export function ToolPanel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "pointer-events-auto flex items-center gap-1 overflow-x-auto rounded-2xl border border-border/50 bg-surface-secondary/95 p-1.5 shadow-2xl backdrop-blur-md ring-1 ring-overlay/40 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-md:max-w-70",
        className,
      )}
      style={{ WebkitOverflowScrolling: "touch", ...props.style }}
      onPointerDown={(e) => {
        e.stopPropagation();
        props.onPointerDown?.(e);
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        props.onPointerMove?.(e);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        props.onPointerUp?.(e);
      }}
      onPointerCancel={(e) => {
        e.stopPropagation();
        props.onPointerCancel?.(e);
      }}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick?.(e);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        props.onDoubleClick?.(e);
      }}
    >
      <div className="flex min-w-max items-center gap-0.5">{children}</div>
    </div>
  );
}

type ActionButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  tooltip?: React.ReactNode;
  active?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
};

export const ActionButton = React.forwardRef<
  HTMLButtonElement,
  ActionButtonProps
>(function ActionButton(
  { tooltip, active, destructive, className, children, disabled, ...rest },
  ref,
) {
  const button = (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-pressed={active}
      data-state={active ? "active" : undefined}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground cursor-pointer shrink-0 touch-manipulation",
        active &&
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm",
        destructive && "text-danger/80 hover:text-danger",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
  if (!tooltip) return button;
  return (
    <Tooltip content={tooltip} delay={0} closeDelay={0}>
      {button}
    </Tooltip>
  );
});

export type ActionPopoverTrigger = (state: {
  open: boolean;
}) => React.ReactElement;

export function ActionPopover({
  tooltip,
  contentClassName,
  placement,
  open: controlledOpen,
  onOpenChange,
  trigger,
  children,
}: {
  tooltip?: React.ReactNode;
  contentClassName?: string;
  placement?: Placement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger: ActionPopoverTrigger;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useControllableState({
    defaultValue: false,
    value: controlledOpen,
    onChange: onOpenChange,
  });

  const triggerNode = trigger({ open });

  const triggerElement = tooltip ? (
    <Tooltip content={tooltip}>{triggerNode}</Tooltip>
  ) : (
    triggerNode
  );

  return (
    <Popover isOpen={open} onOpenChange={setOpen}>
      <Popover.Trigger>{triggerElement}</Popover.Trigger>
      <Popover.Content
        placement={placement}
        className={cn(
          "overflow-hidden rounded-2xl bg-surface-secondary/95! backdrop-blur-md border border-border/50 shadow-2xl ring-1 ring-overlay/40 p-3 focus-visible:outline-0",
          contentClassName,
        )}
      >
        {children}
      </Popover.Content>
    </Popover>
  );
}

export function DeleteAction({
  ariaLabel,
  onDelete,
}: {
  ariaLabel: string;
  onDelete: () => void;
}) {
  const pointerDeletedRef = React.useRef(false);

  return (
    <ActionButton
      aria-label={ariaLabel}
      tooltip="Delete"
      destructive
      onPointerDown={(e) => {
        pointerDeletedRef.current = true;
        e.preventDefault();
        e.stopPropagation();
        onDelete();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (pointerDeletedRef.current) {
          pointerDeletedRef.current = false;
          return;
        }
        onDelete();
      }}
    >
      <Trash className="size-4.5" />
    </ActionButton>
  );
}

export function DuplicateAction({
  ariaLabel,
  onDuplicate,
}: {
  ariaLabel: string;
  onDuplicate: () => void;
}) {
  return (
    <ActionButton
      aria-label={ariaLabel}
      tooltip="Duplicate"
      onClick={onDuplicate}
    >
      <Copy className="size-4.5" />
    </ActionButton>
  );
}
