"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@heroui/react";
import { cn } from "@/lib/utils";

type EditorErrorBoundaryProps = {
  children: React.ReactNode;
  label?: string;
  className?: string;
  resetKeys?: readonly unknown[];
};

type EditorErrorBoundaryState = {
  error: Error | null;
};

function resetKeysChanged(
  prev: readonly unknown[] | undefined,
  next: readonly unknown[] | undefined,
) {
  if (!prev || !next) return false;
  if (prev.length !== next.length) return true;
  return prev.some((value, index) => !Object.is(value, next[index]));
}

export class EditorErrorBoundary extends React.Component<
  EditorErrorBoundaryProps,
  EditorErrorBoundaryState
> {
  state: EditorErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): EditorErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Editor surface crashed", error, info);
  }

  componentDidUpdate(prevProps: EditorErrorBoundaryProps) {
    if (
      this.state.error &&
      resetKeysChanged(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.setState({ error: null });
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { children, className, label = "Editor surface" } = this.props;
    const { error } = this.state;

    if (!error) return children;

    return (
      <div
        className={cn(
          "flex min-h-0 flex-1 items-center justify-center bg-background p-4",
          className,
        )}
      >
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <div>
            <p className="text-sm font-medium text-foreground">
              {label} crashed
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              The rest of the editor is still running.
            </p>
          </div>
          <Button type="button" size="sm" onPress={this.reset}>
            <RotateCcw className="mr-2 size-3.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }
}
