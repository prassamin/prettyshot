import { Fredoka } from "next/font/google";
import { Providers } from "@/providers/providers";
import { cn } from "@/lib/utils";
import "./globals.css";
import { APP_NAME, DEVELOPED_BY, DEVELOPED_BY_URL } from "@/config";

const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka" });

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
  themeColor: "#090b0c",
};

export const generateMetadata = async () => {
  const title = `${APP_NAME}`;
  const description = "";
  return {
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
    publisher: DEVELOPED_BY,
    creator: DEVELOPED_BY,
    authors: [
      {
        name: DEVELOPED_BY,
        url: DEVELOPED_BY_URL,
      },
    ],
    appleWebApp: {
      title: APP_NAME,
    },
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
    },
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
