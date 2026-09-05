import { getBackgrounds } from "@/app/actions/backgrounds";
import { metatag } from "@/lib/metatag";
import { BackgroundsView } from "./view";

export async function generateMetadata() {
  return metatag({
    title: "Backgrounds | Admin",
    robots: "noindex, nofollow",
  });
}

export default async function AdminBackgroundsPage() {
  const backgrounds = await getBackgrounds();

  return (
    <div className="max-w-6xl space-y-8 pb-10">
      <div className="border-b border-border/50 pb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Background Studio
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage mesh &amp; image backgrounds, variants, and their metadata.
        </p>
      </div>

      <BackgroundsView initialBackgrounds={backgrounds} />
    </div>
  );
}
