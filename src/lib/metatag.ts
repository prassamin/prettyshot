import { Metadata } from "next";
import { getCurrentUrl, getOrigin } from "./url";
import { APP_NAME } from "@/config";

export const metatag = async ({
  title,
  url,
  robots = "index, follow",
  keywords = [],
  description,
}: {
  title: string;
  url?: string;
  robots?: "index, follow" | "noindex, nofollow";
  keywords?: string[];
  description?: string;
}) => {
  const thumbnail = `/thumbnail.png`;
  if (!url) url = await getCurrentUrl();

  const fixedKeywords: string[] = [];

  const margedkeywords: string[] = fixedKeywords.concat(keywords);

  const m: Metadata = {
    title: title,
    keywords: margedkeywords,
    openGraph: {
      title: title,
      url: url,
      siteName: title,
      images: [
        {
          url: thumbnail,
          width: 1200,
          height: 630,
          alt: APP_NAME,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      title: title,
      images: [thumbnail],
    },
    alternates: {
      canonical: url,
      languages: { "en-US": url },
    },
    robots: robots,
  };

  if (description) m.description = description;
  return m;
};
