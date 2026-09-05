import { handleSnapshotRequest } from "@/lib/api/snapshot-handler";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  return handleSnapshotRequest(request, props);
}
