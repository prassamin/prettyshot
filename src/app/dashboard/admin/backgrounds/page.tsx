import { AdminForm } from "./components/admin-form";
import { getBackgrounds } from "@/app/actions/backgrounds";
import { BackgroundsList } from "./components/backgrounds-list";
import { metatag } from "@/lib/metatag";

export async function generateMetadata() {
  return metatag({
    title: "Backgrounds | Admin",
    robots: "noindex, nofollow"
  })
}

export default async function AdminPage() {
  const backgrounds = await getBackgrounds();

  return (
    <div className="max-w-4xl space-y-8 pb-10">
      <div className="border-b border-zinc-200/80 pb-6">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          Admin Portal
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage and upload premium assets.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">
            Upload Premium Background
          </h2>
        </div>
        <div className="p-6 sm:p-8">
          <AdminForm />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden mt-8">
        <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            Uploaded Backgrounds
          </h2>
          <span className="text-xs font-medium text-zinc-500 bg-zinc-200/50 px-2.5 py-1 rounded-full">
            {backgrounds.length} Assets
          </span>
        </div>
        <BackgroundsList initialBackgrounds={backgrounds} />
      </div>
    </div>
  );
}
