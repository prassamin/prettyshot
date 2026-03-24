"use client";

import { useState, useEffect } from "react";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppStore } from "@/stores/app-store";

function AppStateInit() {
  const setOrigin = useAppStore((state) => state.setOrigin);
  useEffect(() => {
    setOrigin(window.location.origin);
  }, [setOrigin]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ProgressProvider
        height="3px"
        color="var(--accent)"
        options={{ showSpinner: false }}
        shallowRouting
      >
        <AppStateInit />
        {children}
      </ProgressProvider>
    </QueryClientProvider>
  );
}
