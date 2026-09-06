"use client";

import * as React from "react";
import { Laptop, Monitor, Smartphone, Tablet } from "lucide-react";

import {
  getFramesCatalog,
  type FrameCategoryInfo,
  type FrameGeometry,
} from "@/app/actions/frames";
import { BROWSER_FRAMES } from "./catalog";
import type {
  DeviceOrientation,
  DeviceFrameModel,
  DeviceFrameVariant,
} from "./types";
import type {
  FrameOption,
  FrameCategory,
} from "../property-panel/sections/frame/types";

// In-memory global cache across client navigations
let cachedCatalog: FrameCategoryInfo[] | null = null;
let catalogPromise: Promise<FrameCategoryInfo[]> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

/** Global memory-synced dynamic geometry dictionary */
export const dynamicGeometryMap = new Map<string, FrameGeometry>();

/** Global memory-synced dynamic frame dictionary */
export const dynamicDeviceMap = new Map<string, DeviceFrameModel>();

/** Global memory-synced dynamic variant dictionary */
export const dynamicVariantMap = new Map<string, DeviceFrameVariant[]>();

/** Fallback option for no frame */
export const FALLBACK_NONE_OPTION: FrameOption = {
  id: "none",
  name: "None",
  w: 0,
  h: 0,
  kind: "none",
  variantIds: [],
  previewSrc: null,
  rotatePreview: false,
  isDevice: false,
};

function categoryIconForId(id: string) {
  if (id === "browser") return Monitor;
  if (
    id.startsWith("iphone") ||
    id.startsWith("android") ||
    id.startsWith("phone")
  ) {
    return Smartphone;
  }
  if (id.startsWith("ipad") || id.startsWith("tablet")) {
    return Tablet;
  }
  if (
    id.startsWith("desktop") ||
    id.startsWith("macbook") ||
    id.startsWith("display")
  ) {
    return Laptop;
  }
  return Smartphone;
}

export function normalizeDeviceId(id: string): string {
  return id
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .trim();
}

export function getDeviceIdAliases(id: string): string[] {
  if (!id) return [];
  const raw = id.trim();
  const lower = raw.toLowerCase();
  const underscore = lower.replace(/[\s-]+/g, "_");
  const hyphen = lower.replace(/[\s_]+/g, "-");
  return Array.from(new Set([raw, lower, underscore, hyphen]));
}

function getFromMap<T>(map: Map<string, T>, deviceId: string): T | undefined {
  if (!deviceId) return undefined;
  for (const alias of getDeviceIdAliases(deviceId)) {
    const val = map.get(alias);
    if (val !== undefined) return val;
  }
  return undefined;
}

function populateDynamicMaps(catalog: FrameCategoryInfo[]) {
  dynamicGeometryMap.clear();
  dynamicDeviceMap.clear();
  dynamicVariantMap.clear();

  for (const category of catalog) {
    for (const deviceFrame of category.frames) {
      const aliases = getDeviceIdAliases(deviceFrame.id);

      if (deviceFrame.geometry) {
        for (const alias of aliases) {
          dynamicGeometryMap.set(alias, deviceFrame.geometry);
        }
      }

      const deviceFrameAssets: DeviceFrameVariant[] = [];
      const colorsSet = new Set<string>();
      const orientationsSet = new Set<DeviceOrientation>();

      for (const variant of deviceFrame.variants) {
        if (!variant.frameUrl) continue;

        let orientation: DeviceOrientation = "portrait";
        if (deviceFrame.geometry?.aspectRatio) {
          const parts = deviceFrame.geometry.aspectRatio
            .split("/")
            .map((s) => parseFloat(s.trim()));
          if (
            parts.length === 2 &&
            !isNaN(parts[0]) &&
            !isNaN(parts[1]) &&
            parts[1] > 0
          ) {
            orientation = parts[0] > parts[1] ? "landscape" : "portrait";
          }
        } else if (deviceFrame.supportsOrientation === false) {
          orientation = "landscape";
        }

        const colorKey = variant.id;
        colorsSet.add(colorKey);
        orientationsSet.add(orientation);

        deviceFrameAssets.push({
          deviceId: deviceFrame.id,
          deviceName: deviceFrame.name,
          variantId: colorKey,
          orientation,
          file: `${variant.id}.webp` as any,
          src: variant.frameUrl,
          thumbUrl: variant.thumbUrl ?? variant.frameUrl,
        });
      }

      // Read custom colors map from metadata if present
      if (deviceFrame.colors) {
        Object.keys(deviceFrame.colors).forEach((c) => colorsSet.add(c));
      }

      const defaultVariant =
        deviceFrame.variants.find((v) => v.id === deviceFrame.defaultVariant) ??
        deviceFrame.variants[0];

      const thumbnailSrc =
        defaultVariant?.thumbUrl ??
        defaultVariant?.frameUrl ??
        `/thumbnails/${deviceFrame.id}.webp`;

      const device: DeviceFrameModel = {
        id: deviceFrame.id,
        name: deviceFrame.name,
        kind: deviceFrame.kind,
        thumbnailSrc,
        variantIds: Array.from(colorsSet),
        orientations: Array.from(orientationsSet),
        assets: deviceFrameAssets,
      };

      for (const alias of aliases) {
        dynamicDeviceMap.set(alias, device);
        dynamicVariantMap.set(alias, deviceFrameAssets);
      }
    }
  }
}

/**
 * Builds sections from the cached or static catalog.
 */
export function buildDynamicCategories(
  catalog: FrameCategoryInfo[] | null,
): FrameCategory[] {
  const browserOptions: FrameOption[] = BROWSER_FRAMES.map((deviceFrame) => ({
    id: deviceFrame.id,
    name: deviceFrame.name,
    w: deviceFrame.size.w,
    h: deviceFrame.size.h,
    kind: "browser",
    variantIds: [...deviceFrame.colors],
    colorMap: { dark: "#262626", light: "#f7f7f4" },
    previewSrc: null,
    rotatePreview: false,
    isDevice: false,
  }));

  const browserCategory: FrameCategory = {
    id: "browser",
    label: "Browser",
    icon: Monitor,
    options: browserOptions,
  };

  if (!catalog || catalog.length === 0) {
    return [browserCategory];
  }

  const dynamicCategories: FrameCategory[] = catalog
    .map((category) => {
      const options: FrameOption[] = category.frames
        .map((deviceFrame): FrameOption | null => {
          const device = getFromMap(dynamicDeviceMap, deviceFrame.id);
          const defaultVar =
            deviceFrame.variants.find(
              (v) => v.id === deviceFrame.defaultVariant,
            ) ?? deviceFrame.variants[0];

          let rw = 1;
          let rh = 1;
          if (deviceFrame.geometry?.aspectRatio) {
            const parts = deviceFrame.geometry.aspectRatio
              .split("/")
              .map((s) => parseFloat(s.trim()));
            if (
              parts.length === 2 &&
              !isNaN(parts[0]) &&
              !isNaN(parts[1]) &&
              parts[1] > 0
            ) {
              rw = parts[0];
              rh = parts[1];
            }
          }

          const isLandscape = rw > rh;
          const w = isLandscape ? 800 : 400;
          const h = Math.round(w * (rh / rw));

          // Supports orientation if tall (phone/tablet) and explicitly not disabled
          const supportsOrientation =
            deviceFrame.supportsOrientation ?? rh > rw;

          const previewSrc =
            defaultVar?.thumbUrl ??
            defaultVar?.frameUrl ??
            device?.thumbnailSrc ??
            null;

          return {
            id: deviceFrame.id,
            name: deviceFrame.name,
            w,
            h,
            kind: deviceFrame.kind ?? "phone",
            variantIds:
              device?.variantIds && device.variantIds.length > 0
                ? device.variantIds
                : Object.keys(deviceFrame.colors ?? {}),
            colorMap: deviceFrame.colors ?? {},
            previewSrc,
            rotatePreview: false,
            isDevice: true,
            isFree: deviceFrame.isFree,
            supportsOrientation,
            geometry: deviceFrame.geometry,
          };
        })
        .filter((o): o is FrameOption => o !== null);

      return {
        id: category.id,
        label: category.label,
        icon: categoryIconForId(category.id),
        iconUrl: category.iconUrl,
        options,
      };
    })
    .filter((s) => s.options.length > 0);

  return [browserCategory, ...dynamicCategories];
}

/**
 * Primary React hook to access dynamic Cloudinary frames catalog.
 */
export function useFramesCatalog() {
  const [catalog, setCatalog] = React.useState<FrameCategoryInfo[] | null>(
    cachedCatalog,
  );
  const [isLoading, setIsLoading] = React.useState(!cachedCatalog);

  React.useEffect(() => {
    const update = () => {
      setCatalog(cachedCatalog);
      setIsLoading(false);
    };

    listeners.add(update);

    if (!cachedCatalog) {
      setIsLoading(true);
      if (!catalogPromise) {
        catalogPromise = getFramesCatalog()
          .then((data) => {
            if (data && data.length > 0) {
              cachedCatalog = data;
              populateDynamicMaps(data);
            }
            notifyListeners();
            return data;
          })
          .catch((err) => {
            console.error("Failed to load dynamic frames catalog:", err);
            catalogPromise = null;
            notifyListeners();
            return [];
          });
      }

      catalogPromise.finally(() => {
        setIsLoading(false);
      });
    } else {
      populateDynamicMaps(cachedCatalog);
      update();
    }

    return () => {
      listeners.delete(update);
    };
  }, []);

  const categories = React.useMemo(
    () => buildDynamicCategories(catalog),
    [catalog],
  );
  const allOptions = React.useMemo(
    () => [FALLBACK_NONE_OPTION, ...categories.flatMap((s) => s.options)],
    [categories],
  );

  return {
    catalog,
    categories,
    allOptions,
    isLoading,
  };
}

/**
 * Rotate a Cloudinary image URL dynamically on-the-fly via URL transformation.
 */
export function rotateCloudinaryUrl(url: string, angle: number = 270): string {
  if (!url || !url.includes("cloudinary.com")) return url;
  if (url.includes("/upload/")) {
    return url.replace(/\/upload\/(?:a_\d+\/)?/, `/upload/a_${angle}/`);
  }
  if (url.includes("/authenticated/")) {
    return url.replace(
      /\/authenticated\/(?:a_\d+\/)?/,
      `/authenticated/a_${angle}/`,
    );
  }
  return url;
}

/**
 * Synchronously look up a dynamic device deviceFrame.
 * If only portrait artwork exists and landscape is requested, transforms via Cloudinary rotation (a_270).
 */
export function lookupDynamicDeviceFrameVariant(
  deviceId: string,
  variantId?: string,
  orientation?: DeviceOrientation,
): DeviceFrameVariant | null {
  const dynamicAssets = getFromMap(dynamicVariantMap, deviceId);
  if (dynamicAssets && dynamicAssets.length > 0) {
    const clean = (c: string) =>
      c
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

    const targetColor = variantId ? clean(variantId) : "";

    // Exact match with target color and orientation
    const exactMatch =
      targetColor && orientation
        ? dynamicAssets.find(
            (a) =>
              clean(a.variantId) === targetColor &&
              a.orientation === orientation,
          )
        : null;
    if (exactMatch) return exactMatch;

    // Exact color match
    const colorMatch = targetColor
      ? dynamicAssets.find((a) => clean(a.variantId) === targetColor)
      : null;
    if (
      colorMatch &&
      (!orientation || colorMatch.orientation === orientation)
    ) {
      return colorMatch;
    }

    // Partial/fuzzy color match (e.g. "black" matching "black_titanium" or "space_black")
    const partialMatch = targetColor
      ? dynamicAssets.find(
          (a) =>
            clean(a.variantId).includes(targetColor) ||
            targetColor.includes(clean(a.variantId)),
        )
      : null;

    // Orientation match or first available asset
    const baseAsset =
      colorMatch ??
      partialMatch ??
      (orientation
        ? dynamicAssets.find((a) => a.orientation === orientation)
        : null) ??
      dynamicAssets[0];

    if (baseAsset) {
      if (orientation === "landscape" && baseAsset.orientation === "portrait") {
        return {
          ...baseAsset,
          orientation: "landscape",
          src: rotateCloudinaryUrl(baseAsset.src, 270),
          thumbUrl: baseAsset.thumbUrl
            ? rotateCloudinaryUrl(baseAsset.thumbUrl, 270)
            : undefined,
        };
      } else if (
        orientation === "portrait" &&
        baseAsset.orientation === "landscape"
      ) {
        return {
          ...baseAsset,
          orientation: "portrait",
          src: rotateCloudinaryUrl(baseAsset.src, 90),
          thumbUrl: baseAsset.thumbUrl
            ? rotateCloudinaryUrl(baseAsset.thumbUrl, 90)
            : undefined,
        };
      }
      return baseAsset;
    }
  }

  return null;
}

/**
 * Synchronously look up dynamic device deviceFrame metadata.
 */
export function lookupDynamicDeviceFrameModel(
  deviceId: string,
): DeviceFrameModel | null {
  return getFromMap(dynamicDeviceMap, deviceId) ?? null;
}

/**
 * Synchronously look up dynamic geometry for a device deviceFrame.
 * Inverts aspect ratios when oriented horizontally.
 */
export function lookupDynamicGeometry(
  deviceId: string,
  orientation?: DeviceOrientation | "horizontal" | "vertical",
): FrameGeometry {
  const dynamicGeometry = getFromMap(dynamicGeometryMap, deviceId);
  const baseGeom = dynamicGeometry ?? {
    aspectRatio: "16 / 9",
    screen: {
      aspectRatio: "16 / 9",
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      borderRadius: 0,
    },
  };

  const isLandscape =
    orientation === "landscape" || orientation === "horizontal";
  if (isLandscape) {
    const parse = (ratioStr: string) => {
      const parts = ratioStr.split("/").map((s) => parseFloat(s.trim()));
      if (
        parts.length === 2 &&
        !isNaN(parts[0]) &&
        !isNaN(parts[1]) &&
        parts[0] > 0 &&
        parts[1] > 0
      ) {
        return parts[0] / parts[1];
      }
      return 1;
    };

    const deviceAspect = parse(baseGeom.aspectRatio);
    const screenAspect = parse(baseGeom.screen.aspectRatio);

    if (deviceAspect < 1) {
      const invertRatio = (r: string) => {
        const p = r.split("/").map((s) => s.trim());
        return p.length === 2 ? `${p[1]} / ${p[0]}` : r;
      };

      // In landscape, scale must adapt by the aspect ratio ratio so top/bottom bezels match perfectly:
      const landscapeScale =
        baseGeom.screen.scale * (deviceAspect / screenAspect);

      return {
        aspectRatio: invertRatio(baseGeom.aspectRatio),
        screen: {
          aspectRatio: invertRatio(baseGeom.screen.aspectRatio),
          scale: landscapeScale,
          offsetX: -(baseGeom.screen.offsetY ?? 0),
          offsetY: baseGeom.screen.offsetX ?? 0,
          borderRadius: baseGeom.screen.borderRadius,
        },
      };
    }
  }

  return baseGeom;
}
