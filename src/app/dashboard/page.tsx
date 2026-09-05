import { metatag } from "@/lib/metatag";
import DashboardOverview from "./view";
import { createServerClient } from "@/lib/supabase/server";
import { isPro } from "@/lib/utils";

export default async function DashboardOverviewPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pro = isPro(user).isActive;

  let designs: any = [];
  if (pro) {
    const { data } = await supabase
      .from("designs")
      .select("id, name, updated_at, config")
      .eq("user_id", user?.id)
      .order("updated_at", { ascending: false });

    designs = data || [];
  }

  return <DashboardOverview initialDesigns={designs} />;
}

export async function generateMetadata() {
  return metatag({
    title: "Dashboard",
    robots: "noindex, nofollow",
  });
}
