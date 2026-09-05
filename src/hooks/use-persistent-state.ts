"use client";
import * as React from "react";
export function usePersistentState<T>(key: string, fallback: T, isValid?: (val: any) => boolean) {
  const [value, setValue] = React.useState<T>(fallback);
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return;
      const parsed = JSON.parse(raw);
      if (!isValid || isValid(parsed)) setValue(parsed);
    } catch {}
  }, [key]);
  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue] as const;
}
