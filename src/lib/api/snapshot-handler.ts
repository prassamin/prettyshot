import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function computeETag(
  designId: string,
  updatedAt: string,
  format: string,
): string {
  const raw = `${designId}-${updatedAt}-${format}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `W/"${Math.abs(hash).toString(16)}"`;
}

export async function handleSnapshotRequest(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await props.params;

    // Validate UUID
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Invalid design identifier" },
        { status: 400 },
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
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    const updatedAt = design.updated_at || new Date().toISOString();
    const etag = computeETag(id, updatedAt, "webp");

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
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Snapshot not found", de: downloadError },
      { status: 404 },
    );
  } catch (err: any) {
    console.error("Error retrieving snapshot:", err);
    return new Response(`Snapshot error: ${err?.message || "Internal error"}`, {
      status: 500,
    });
  }
}
