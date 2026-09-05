"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@heroui/react";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  title: string;
  description: string;
  isDanger?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => Promise<void> | void;
  onCancel?: () => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = React.createContext<ConfirmContextType | undefined>(
  undefined,
);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<ConfirmOptions>({
    title: "",
    description: "",
  });
  const [resolver, setResolver] = React.useState<
    ((value: boolean) => void) | null
  >(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const confirm = React.useCallback((options: ConfirmOptions): Promise<boolean> => {
    setConfig(options);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = React.useCallback(async () => {
    if (config.onConfirm) {
      setIsLoading(true);
      try {
        await config.onConfirm();
        if (resolver) resolver(true);
        setIsOpen(false);
      } catch (err) {
        console.error("Confirmation action error:", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      if (resolver) resolver(true);
      setIsOpen(false);
    }
  }, [resolver, config]);

  const handleCancel = React.useCallback(() => {
    if (isLoading) return; // Prevent closing while action is in progress
    if (config.onCancel) config.onCancel();
    if (resolver) resolver(false);
    setIsOpen(false);
  }, [resolver, config, isLoading]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open && !isLoading) handleCancel();
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="p-0 sm:max-w-90 overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-2xl">
              <div className="flex flex-col items-center px-6 pt-6 pb-2 text-center select-none">
                {/* Layered Glowing Halo Icon */}
                <div
                  className={cn(
                    "mb-4 grid size-12 place-items-center rounded-full transition-all",
                    config.isDanger
                      ? "bg-danger-soft text-danger ring-8 ring-danger/5 shadow-xs"
                      : "bg-primary/15 text-primary ring-8 ring-primary/5 shadow-xs",
                  )}
                >
                  <AlertTriangle className="size-5.5 stroke-[2.2]" />
                </div>

                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  {config.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {config.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 px-6 pb-6 pt-3 select-none">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 cursor-pointer rounded-xl border border-border/80 bg-surface-tertiary/70 py-2.5 text-[13px] font-medium text-foreground/80 transition-all hover:bg-surface-secondary hover:text-foreground active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shadow-xs"
                >
                  {config.cancelLabel ?? "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={cn(
                    "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-foreground transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shadow-md",
                    config.isDanger
                      ? "bg-danger hover:bg-danger/90 shadow-danger/25"
                      : "bg-primary hover:bg-primary/90 shadow-primary/25",
                  )}
                >
                  {isLoading && (
                    <span className="size-3.5 animate-spin rounded-full border-2 border-foreground/40 border-t-foreground" />
                  )}
                  {config.confirmLabel ?? (config.isDanger ? "Delete" : "Confirm")}
                </button>
              </div>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = React.useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}