import { EditorView } from "./view";
import { metatag } from "@/lib/metatag";
import { createServerClient } from "@/lib/supabase/server";

export const generateMetadata = () => {
  return metatag({
    title: `Editor`,
    description:
      "Drop any screenshot, pick a style, and export a beautiful image in seconds. Free to use, or upgrade to Lifetime Pro for cloud sync and 4K export.",
  });
};

import { Suspense } from "react";

export default async function EditorPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const id = searchParams.id as string | undefined;

  let initialConfig = null;

  if (id) {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from("designs")
      .select("config")
      .eq("id", id)
      .single();
    
    if (data?.config) {
      initialConfig = data.config;
    }
  }

  return (
    <Suspense fallback={<div className="flex h-dvh bg-zinc-50 items-center justify-center">Loading editor...</div>}>
      <EditorView initialConfig={initialConfig} serverId={id} />
    </Suspense>
  );
}
