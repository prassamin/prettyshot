"use client";

import { useRouter as useRouterImpl } from "@bprogress/next";

type NavigationOptions = {
  scroll?: boolean;
  force?: boolean;
  auth?: boolean;
  next?: string;
};

export const useRouter = () => {
  const router = useRouterImpl();

  return {
    push: (href: string, options?: NavigationOptions) => {
      const { next, auth, ...opts } = options || {};
      if (auth) {
        const url = new URL(href, window.location.href);
        url.searchParams.set("next", next || window.location.pathname);
        console.log("Redirecting to", url.href);
        return router.push(url.href, opts);
      }
      return router.push(href, opts);
    },

    replace:
      (href: string, options?: Pick<NavigationOptions, "scroll" | "force">) =>
      () => {
        return router.replace(href, options);
      },
    refresh: () => router.refresh(),
    back: () => router.back(),
    forward: () => router.forward(),
  };
};
