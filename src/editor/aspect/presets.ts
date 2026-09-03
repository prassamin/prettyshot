import type { AspectCategory, AspectOption } from "./types";

export const ASPECT_CATEGORIES: AspectCategory[] = [
  {
    id: "basic",
    label: "Standard",
    options: [
      { id: "auto", name: "Auto Fit", ratio: "—", w: 0, h: 0 },
      {
        id: "16-9",
        name: "Widescreen (16:9)",
        ratio: "16:9",
        w: 1920,
        h: 1080,
      },
      { id: "1-1", name: "Square (1:1)", ratio: "1:1", w: 1080, h: 1080 },
      { id: "9-16", name: "Vertical (9:16)", ratio: "9:16", w: 1080, h: 1920 },
      { id: "4-3", name: "Classic (4:3)", ratio: "4:3", w: 1600, h: 1200 },
      { id: "3-2", name: "Photo (3:2)", ratio: "3:2", w: 1500, h: 1000 },
      {
        id: "golden",
        name: "Golden (1.6:1)",
        ratio: "1.618:1",
        w: 1618,
        h: 1000,
      },
      { id: "21-9", name: "Ultrawide (21:9)", ratio: "21:9", w: 2560, h: 1080 },
    ],
  },
  {
    id: "twitter",
    label: "Twitter",
    options: [
      { id: "twitter-post", name: "Feed Post", ratio: "16:9", w: 1600, h: 900 },
      {
        id: "twitter-square",
        name: "Square Post",
        ratio: "1:1",
        w: 1080,
        h: 1080,
      },
      {
        id: "twitter-photo",
        name: "Portrait Post",
        ratio: "4:5",
        w: 1200,
        h: 1500,
      },
      {
        id: "twitter-header",
        name: "Header Banner",
        ratio: "3:1",
        w: 1500,
        h: 500,
      },
    ],
  },
  {
    id: "instagram",
    label: "Instagram",
    options: [
      {
        id: "instagram-square",
        name: "Square Post",
        ratio: "1:1",
        w: 1080,
        h: 1080,
      },
      {
        id: "instagram-portrait",
        name: "Portrait Post",
        ratio: "4:5",
        w: 1080,
        h: 1350,
      },
      {
        id: "instagram-story",
        name: "Story / Reel",
        ratio: "9:16",
        w: 1080,
        h: 1920,
      },
      {
        id: "instagram-landscape",
        name: "Landscape",
        ratio: "16:9",
        w: 1600,
        h: 900,
      },
    ],
  },
  {
    id: "youtube",
    label: "YouTube",
    options: [
      {
        id: "youtube-thumb",
        name: "Thumbnail",
        ratio: "16:9",
        w: 1280,
        h: 720,
      },
      {
        id: "youtube-video",
        name: "Video (1080p)",
        ratio: "16:9",
        w: 1920,
        h: 1080,
      },
      { id: "youtube-short", name: "Shorts", ratio: "9:16", w: 1080, h: 1920 },
      {
        id: "youtube-cover",
        name: "Channel Banner",
        ratio: "16:9",
        w: 2048,
        h: 1152,
      },
    ],
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    options: [
      {
        id: "linkedin-share",
        name: "Feed Post",
        ratio: "1.9:1",
        w: 1200,
        h: 627,
      },
      {
        id: "linkedin-square",
        name: "Square Post",
        ratio: "1:1",
        w: 1080,
        h: 1080,
      },
      {
        id: "linkedin-cover",
        name: "Profile Banner",
        ratio: "4:1",
        w: 1584,
        h: 396,
      },
    ],
  },
  {
    id: "app-store",
    label: "App Store",
    options: [
      {
        id: "app-store-iphone-67",
        name: "iPhone 6.7″",
        ratio: "9:19.5",
        w: 1284,
        h: 2778,
      },
      {
        id: "app-store-iphone-61",
        name: "iPhone 6.1″",
        ratio: "9:19.5",
        w: 1179,
        h: 2556,
      },
      {
        id: "app-store-ipad-129",
        name: "iPad 12.9″",
        ratio: "3:4",
        w: 2048,
        h: 2732,
      },
      {
        id: "app-store-mac",
        name: "Mac Store",
        ratio: "16:10",
        w: 2880,
        h: 1800,
      },
    ],
  },
  {
    id: "play-store",
    label: "Play Store",
    options: [
      {
        id: "play-store-phone",
        name: "Phone Screenshot",
        ratio: "9:16",
        w: 1080,
        h: 1920,
      },
      {
        id: "play-store-feature",
        name: "Feature Graphic",
        ratio: "16:9",
        w: 1024,
        h: 500,
      },
      {
        id: "play-store-tablet-10",
        name: "Tablet 10″",
        ratio: "16:9",
        w: 1920,
        h: 1080,
      },
    ],
  },
  {
    id: "opengraph",
    label: "Open Graph",
    options: [
      {
        id: "opengraph-standard",
        name: "Social OG Card",
        ratio: "1.9:1",
        w: 1200,
        h: 630,
      },
      {
        id: "opengraph-square",
        name: "Square OG",
        ratio: "1:1",
        w: 1200,
        h: 1200,
      },
      {
        id: "opengraph-banner",
        name: "Web Banner",
        ratio: "2:1",
        w: 1200,
        h: 600,
      },
    ],
  },
  {
    id: "tiktok",
    label: "TikTok",
    options: [
      {
        id: "tiktok-post",
        name: "Video / Post",
        ratio: "9:16",
        w: 1080,
        h: 1920,
      },
      {
        id: "tiktok-photos",
        name: "Photo Post",
        ratio: "1:1",
        w: 1080,
        h: 1080,
      },
    ],
  },
  {
    id: "pinterest",
    label: "Pinterest",
    options: [
      {
        id: "pinterest-optimal",
        name: "Standard Pin",
        ratio: "2:3",
        w: 1000,
        h: 1500,
      },
      {
        id: "pinterest-long",
        name: "Long Pin",
        ratio: "1:2",
        w: 1000,
        h: 2000,
      },
    ],
  },
];

export const ALL_OPTIONS: (AspectOption & { category: string })[] =
  ASPECT_CATEGORIES.flatMap((c) => {
    return c.options.map((option) => ({ ...option, category: c.id }));
  });
export const ALL_CATEGORY_ID = "all";

export function findAspectOption(id: string): AspectOption | undefined {
  return ALL_OPTIONS.find((o) => o.id === id);
}
