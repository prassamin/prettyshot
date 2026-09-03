import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { metatag } from "@/lib/metatag";
import { LOCAL_DESIGNS_COOKIE } from "@/editor/lib/local-design-storage";
import { createServerClient } from "@/lib/supabase/server";
import { isPro } from "@/lib/utils";

export const generateMetadata = () => {
  return metatag({
    title: `Editor`,
    description:
      "Drop any screenshot, pick a style, and export a beautiful image in seconds. Free to use, or upgrade to Lifetime Pro for cloud sync and 4K export.",
  });
};

/** Parse the recent local-designs cookie into an ordered id list. */
function readLocalDesignIds(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export default async function EditorEntryPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const id = searchParams.id as string | undefined;

  // A design id in the query string (legacy `?id=`) becomes the canonical path.
  if (id) {
    redirect(`/editor/${id}`);
  }

  // If this device has an active local-only design, route to it so the user
  // can continue their work (and if they are logged in as Pro, it will seamlessly
  // migrate and sync to their cloud account).
  const cookieStore = await cookies();
  const localIds = readLocalDesignIds(
    cookieStore.get(LOCAL_DESIGNS_COOKIE)?.value,
  );
  const lastId = localIds[0];
  if (lastId) {
    redirect(`/editor/${lastId}`);
  }

  redirect(`/editor/${crypto.randomUUID()}`);
}
