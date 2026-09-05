import { getFramesCatalogUncached } from "@/app/actions/frames";
import { metatag } from "@/lib/metatag";
import { FramesView } from "./view";

export async function generateMetadata() {
  return metatag({
    title: "Frames | Admin",
    robots: "noindex, nofollow",
  });
}

export default async function AdminFramesPage() {
  const catalog = await getFramesCatalogUncached();

  return (
    <div className="max-w-6xl space-y-8 pb-10">
      <div className="border-b border-border/50 pb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Frame Studio
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage device frames, variants, and their metadata.
        </p>
      </div>

      <FramesView initialCatalog={catalog} />
    </div>
  );
}