import { useEditorEngine } from "@/editor/lib/engine";

export const DEFAULT_EXPORT_FILENAME_FORMAT =
  "prettyshot_export_{SCALE}_{DATE}";
export const EXPORT_FILENAME_FORMAT_MAX_LENGTH = 200;

export type ExportFilenameVariable = {
  token: string;
  label: string;
};

export const EXPORT_FILENAME_VARIABLES: ExportFilenameVariable[] = [
  { token: "{DATE}", label: "Current date and time" },
  { token: "{TEMPLATE}", label: "Current template / preset" },
  { token: "{SCALE}", label: "Export scale (hd, 4k, …)" },
  { token: "{RES}", label: "Pixel size as width×height" },
  { token: "{WIDTH}", label: "Export width in pixels" },
  { token: "{HEIGHT}", label: "Export height in pixels" },
  { token: "{RANDOM}", label: "Random string" },
];

const TOKEN_PATTERN = /\{(DATE|TEMPLATE|SCALE|RES|RANDOM|WIDTH|HEIGHT)\}/g;

export type ExportFilenameContext = {
  date: string;
  template: string;
  scale: string;
  random: string;
  width: number | string;
  height: number | string;
};

export function exportTimestamp(date = new Date()): string {
  return date
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
}

export function randomFilenameToken(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/** Replace tokens then strip characters that are unsafe in filenames. */
export function applyExportFilenameFormat(
  format: string,
  ctx: ExportFilenameContext,
): string {
  const values: Record<string, string> = {
    "{DATE}": ctx.date,
    "{TEMPLATE}": ctx.template,
    "{SCALE}": ctx.scale,
    "{RES}": `${ctx.width}x${ctx.height}`,
    "{RANDOM}": ctx.random,
    "{WIDTH}": String(ctx.width),
    "{HEIGHT}": String(ctx.height),
  };

  const replaced = format.replace(
    TOKEN_PATTERN,
    (match) => values[match] ?? match,
  );

  const safe = replaced
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^[._-]+|[._-]+$/g, "");

  return safe || "prettyshot_export";
}

export function getExportTemplateLabel(): string {
  try {
    const state = useEditorEngine.getState();
    const aspect = state.present.aspect;
    if (aspect?.w && aspect?.h) return `${aspect.w}x${aspect.h}`;
  } catch {}
  return "default";
}

export function buildExportFilename(opts: {
  format: string;
  scale: string;
  template: string;
  width: number;
  height: number;
  extension: string;
}): string {
  const name = applyExportFilenameFormat(opts.format, {
    date: exportTimestamp(),
    template: opts.template,
    scale: opts.scale,
    random: randomFilenameToken(),
    width: opts.width,
    height: opts.height,
  });
  const ext = opts.extension.startsWith(".")
    ? opts.extension
    : `.${opts.extension}`;
  return `${name}${ext}`;
}

export function resolveExportDownloadFilename(opts: {
  scale: string;
  width: number;
  height: number;
  extension: string;
}): string {
  return buildExportFilename({
    format: DEFAULT_EXPORT_FILENAME_FORMAT,
    scale: opts.scale,
    template: getExportTemplateLabel(),
    width: opts.width,
    height: opts.height,
    extension: opts.extension,
  });
}
