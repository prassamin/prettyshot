import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import { Providers } from "@/providers/providers";
import { cn } from "@/lib/utils";
import "./globals.css";
import { APP_NAME, DEVELOPED_BY, DEVELOPED_BY_URL } from "@/config";
import { getOrigin } from "@/lib/url";

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
  return {
    metadataBase: new URL(origin),
    title: {
      default: `${APP_NAME} | Make your screenshots look stunning`,
      template: `%s | ${APP_NAME}`,
    },
    description:
      "Drop any screenshot, pick a style, and export a beautiful image in seconds. Gradient backgrounds, shadows, noise, perspective, zero signup, totally free.",
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
      "product hunt screenshot",
    ],
    publisher: DEVELOPED_BY,
    creator: DEVELOPED_BY,
    authors: [{ name: DEVELOPED_BY, url: DEVELOPED_BY_URL }],
    appleWebApp: { title: APP_NAME },
    openGraph: {
      type: "website",
      siteName: APP_NAME,
      locale: "en_US",
      images: [
        { url: "/thumbnail.png", width: 1200, height: 630, alt: APP_NAME },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/thumbnail.png"],
    },
    robots: { index: true, follow: true },
  };
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(fredoka.variable)}>
      <body className={cn("antialiased")}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
