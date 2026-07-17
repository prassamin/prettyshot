import { metatag } from "@/lib/metatag";
import DashboardOverview from "./view";

export default function DashboardOverviewPage() {
  return <DashboardOverview />;
}

export async function generateMetadata() {
  return metatag({
    title: "Dashboard",
    robots: "index, follow",
  });
}
