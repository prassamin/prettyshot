import { createServerClient } from "@/lib/supabase/server";
import AllDesignsPageView from "./view";
import { metatag } from "@/lib/metatag";

import { isPro } from "@/lib/utils";

export default async function AllDesignsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let designs: {
    id: string;
    name: string;
    updated_at: string;
    config: Record<string, any>;
  }[] = [];

  if (user) {
    if (isPro(user).isActive) {
      const { data } = await supabase
        .from("designs")
        .select("id, name, updated_at, config")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      designs = data || [];
    }
  }

  return <AllDesignsPageView designs={designs} />;
}

export async function generateMetadata() {
  return metatag({
    title: "Designs | Dashboard",
    robots: "noindex, nofollow",
  });
}
