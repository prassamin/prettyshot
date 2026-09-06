import { redirect } from "next/navigation";

import { EditorView } from "./view";
import { metatag } from "@/lib/metatag";
import {
  createServerClient,
  createServiceClient,
} from "@/lib/supabase/server";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";


export const generateMetadata = () => {
  return metatag({
    title: `Editor`,
    description:
      "Drop any screenshot, pick a style, and export a beautiful image in seconds. Free to use, or upgrade to Lifetime Pro for cloud sync and 4K export.",
  });
};

export default async function EditorDesignPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  let initialConfig = null;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // RLS-scoped fetch — only returns the config when this row belongs to the
    // signed-in user.
    const { data } = await supabase
      .from("designs")
      .select("config")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (data?.config) {
      initialConfig = data.config;
    } else {
      // No config for this user. If the design exists at all, it belongs to
      // someone else — don't let them open (and later overwrite) it.
      const admin = createServiceClient();
      const { data: exists } = await admin
        .from("designs")
        .select("id")
        .eq("id", id)
        .single();

      if (exists) {
        return <NotFound/>
      }
    }
  } else {
    // Anonymous visitor. If the design exists in the cloud it may be theirs —
    // send them to login first (returning here after auth). A non-existent id
    // just opens a fresh local editor.
    const admin = createServiceClient();
    const { data: exists } = await admin
      .from("designs")
      .select("id")
      .eq("id", id)
      .single();

    if (exists) {
      redirect(`/login?next=/editor/${id}`);
    }
  }

  return <EditorView initialConfig={initialConfig} serverId={id} />;
}

function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <Image
        src="/prettyshot.svg"
        alt="PrettyShot"
        width={48}
        height={36}
        priority
        className="shrink-0 opacity-80"
      />
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Design not found
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This design doesn&apos;t exist, or you don&apos;t have access to it.
          It may have been deleted or shared with someone else.
        </p>
      </div>
      <Link
        href="/editor"
        className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-surface-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-tertiary"
      >
        <ArrowLeft className="size-4" />
        Open the editor
      </Link>
    </div>
  );
}
