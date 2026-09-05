"use client";

import { toast } from "@heroui/react";
import { useRouter } from "@/hooks/use-router";

const ERROR_MESSAGES = {
  AUTH_REQUIRED: "Please log in to continue.",
  PRO_REQUIRED: "This feature requires a Pro license.",
  FORBIDDEN: "Admin access only.",
  NOT_FOUND: "Resource not found.",
  SERVER_ERROR: "Something went wrong.",
} as const;

function getErrorType(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("Unauthorized") || message.includes("Please log in")) return "AUTH_REQUIRED";
  if (message.includes("Pro license") || message.includes("Pro required")) return "PRO_REQUIRED";
  if (message.includes("Admin access")) return "FORBIDDEN";
  if (message.includes("not found") || message.includes("Not found")) return "NOT_FOUND";
  if (message.includes("Failed to") || message.includes("Something went wrong")) return "SERVER_ERROR";

  return null;
}

/**
 * Hook that returns a function to handle errors thrown by server actions.
 * Shows a toast and performs side-effects (redirects) based on error type.
 *
 * Returns `true` if the error was fully handled (caller can stop).
 * Returns `false` if the error is unknown and the caller should handle it.
 */
export function useActionErrorHandler() {
  const router = useRouter();

  return function handleError(error: unknown, options?: { silent?: boolean }): boolean {
    const errorType = getErrorType(error);

    if (errorType === "AUTH_REQUIRED") {
      if (!options?.silent) {
        toast.danger(ERROR_MESSAGES.AUTH_REQUIRED);
      }
      router.push("/login", { auth: true, next: "/checkout" });
      return true;
    }

    if (errorType === "PRO_REQUIRED") {
      if (!options?.silent) {
        toast.danger(ERROR_MESSAGES.PRO_REQUIRED);
      }
      router.push("/checkout", { external: true });
      return true;
    }

    if (errorType === "FORBIDDEN") {
      if (!options?.silent) {
        toast.danger(ERROR_MESSAGES.FORBIDDEN);
      }
      return true;
    }

    if (errorType === "NOT_FOUND") {
      if (!options?.silent) {
        toast.danger(ERROR_MESSAGES.NOT_FOUND);
      }
      return true;
    }

    if (errorType === "SERVER_ERROR") {
      if (!options?.silent) {
        toast.danger(ERROR_MESSAGES.SERVER_ERROR);
      }
      return true;
    }

    // Unknown error — log it but don't swallow silently
    console.error("Unhandled action error:", error);
    if (!options?.silent) {
      toast.danger("An unexpected error occurred. Please try again.");
    }
    return false;
  };
}
