import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import { Providers } from "@/providers/providers";
import { cn } from "@/lib/utils";
import "./globals.css";
import { APP_NAME, DEVELOPED_BY, DEVELOPED_BY_URL } from "@/config";
import { getOrigin } from "@/lib/url";
import { createServerClient } from "@/lib/supabase/server";

const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
  themeColor: "#090b0c",
};

export const generateMetadata = async (): Promise<Metadata> => {
  const origin = await getOrigin();
  const title = `${APP_NAME} | Every screenshot deserves to be remembered`;
  const description =
    "Drop any screenshot, pick a style, and export a beautiful image in seconds. Gradient backgrounds, shadows, noise, perspective, zero signup, totally free.";
  return {
    metadataBase: new URL(origin),
    title: { default: title, template: `%s | ${APP_NAME}` },
    description: description,
    keywords: [
      "screenshot beautifier",
      "screenshot editor",
      "pretty screenshot",
      "screenshot tool",
      "gradient background",
      "screenshot maker",
      "image beautifier",
      "free screenshot tool",
      "social media screenshot",
      "screenshot",
      "product hunt screenshot",
    ],
    publisher: DEVELOPED_BY,
    creator: DEVELOPED_BY,
    authors: [{ name: DEVELOPED_BY, url: DEVELOPED_BY_URL }],
    appleWebApp: { title: APP_NAME },
    icons: {
      icon: [
        { url: "/favicons/favicon-96x96.png", sizes: "96x96" },
        { url: "/favicons/favicon-192x192.png", sizes: "192x192" },
        { url: "/favicons/favicon-512x512.png", sizes: "512x512" },
        { url: "/favicons/favicon.svg" },
      ],
      shortcut: ["/favicons/favicon.svg"],
      apple: [
        {
          url: "/favicons/favicon-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
      ],
    },
    manifest: "/favicons/site.webmanifest",
    openGraph: {
      title: title,
      description: description,
      type: "website",
      siteName: APP_NAME,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
    },
  };
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const isTrialActive = user.user_metadata?.trial_ends_at ? new Date(user.user_metadata.trial_ends_at) > new Date() : false;
    
    (user as any).is_pro = user.user_metadata?.is_pro || isTrialActive;
    (user as any).polar_order_id = user.user_metadata?.polar_order_id;
    (user as any).trial_ends_at = user.user_metadata?.trial_ends_at;
  }
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={cn(fredoka.variable)}
    >
      <body className={cn("antialiased")}>
        <Providers user={user as any}>{children}</Providers>
      </body>
    </html>
  );
}
