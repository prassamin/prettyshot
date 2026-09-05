import React from "react";
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { createServiceClient } from "@/lib/supabase/server";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SnapshotSize = "og" | "thumb" | "square" | "custom";

function resolveDimensions(
  size: SnapshotSize,
  customW?: string | null,
  customH?: string | null,
): { width: number; height: number } {
  switch (size) {
    case "thumb":
      return { width: 600, height: 338 };
    case "square":
      return { width: 800, height: 800 };
    case "custom": {
      const parsedW = parseInt(customW || "1200", 10);
      const parsedH = parseInt(customH || "630", 10);
      return {
        width: Math.min(Math.max(isNaN(parsedW) ? 1200 : parsedW, 200), 1920),
        height: Math.min(Math.max(isNaN(parsedH) ? 630 : parsedH, 200), 1080),
      };
    }
    case "og":
    default:
      return { width: 1200, height: 630 };
  }
}

function computeETag(
  designId: string,
  updatedAt: string,
  size: string,
  format: string,
): string {
  const raw = `${designId}-${updatedAt}-${size}-${format}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `W/"${Math.abs(hash).toString(16)}"`;
}

function renderNotFoundSnapshot(
  width: number,
  height: number,
  errorMsg: string,
) {
  try {
    const element = React.createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0d12",
          color: "#ffffff",
          fontFamily: "sans-serif",
          padding: 40,
        },
      },
      React.createElement(
        "div",
        {
          style: {
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: 8,
            display: "flex",
          },
        },
        "PrettyShot",
      ),
      React.createElement(
        "div",
        {
          style: {
            fontSize: 16,
            color: "rgba(255, 255, 255, 0.5)",
            textAlign: "center",
            display: "flex",
            maxWidth: 400,
          },
        },
        errorMsg,
      ),
    );

    return new ImageResponse(element, {
      width,
      height,
      status: 404,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "Content-Type": "image/png",
      },
    });
  } catch {
    return new Response(errorMsg, { status: 404 });
  }
}

export async function handleSnapshotRequest(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await props.params;

    const searchParams = request.nextUrl.searchParams;
    const sizeParam = (searchParams.get("size") || "og") as SnapshotSize;
    const customW = searchParams.get("w");
    const customH = searchParams.get("h");
    const download = searchParams.get("download") === "true";

    const { width, height } = resolveDimensions(sizeParam, customW, customH);

    // Validate UUID
    if (!id || !UUID_REGEX.test(id)) {
      return renderNotFoundSnapshot(
        width,
        height,
        "Invalid project identifier",
      );
    }

    // Fetch design metadata from Supabase using Service Client
    const admin = createServiceClient();
    const { data: design, error } = await admin
      .from("designs")
      .select("id, user_id, name, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (error || !design) {
      return renderNotFoundSnapshot(
        width,
        height,
        "Design not found or removed",
      );
    }

    const updatedAt = design.updated_at || new Date().toISOString();
    const etag = computeETag(id, updatedAt, sizeParam, "webp");

    // Handle conditional 304 cache validation
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control":
            "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        },
      });
    }

    // Fetch strictly from snapshots/{user.id}/{designId}.webp
    const { data: fileBlob, error: downloadError } = await admin.storage
      .from("prettyshot")
      .download(`snapshots/${design.user_id}/${id}.webp`);

    if (fileBlob && !downloadError) {
      const buffer = await fileBlob.arrayBuffer();
      const filename = `${(design.name || "prettyshot").toLowerCase().replace(/[^a-z0-9_-]/g, "-")}-snapshot.webp`;

      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control":
            "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          ETag: etag,
          ...(download
            ? {
                "Content-Disposition": `attachment; filename="${filename}"`,
              }
            : {}),
        },
      });
    }

    return renderNotFoundSnapshot(width, height, "Snapshot not found");
  } catch (err: any) {
    console.error("Error retrieving snapshot:", err);
    return new Response(`Snapshot error: ${err?.message || "Internal error"}`, {
      status: 500,
    });
  }
}
