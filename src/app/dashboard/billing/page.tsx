import { metatag } from "@/lib/metatag";
import { getOrders } from "./actions";
import { BillingPageView } from "./view";

export default async function BillingPage() {
  const orders = await getOrders();
  return <BillingPageView orders={orders} />;
}

export async function generateMetadata() {
  return metatag({
    title: "Billing & License",
    robots: "noindex, nofollow",
  });
}
