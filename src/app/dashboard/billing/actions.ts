"use server";

import { POLAR_ACCESS_TOKEN } from "@/config/env";
import { polar, POLAR_API_ORIGIN } from "@/lib/polar";
import { createServerClient } from "@/lib/supabase/server";
import axios from "axios";
import { unstable_cache } from "next/cache";

const getCachedPolarOrders = unstable_cache(
  async (userId: string) => {
    const customer = await polar.customers.getExternal({
      externalId: userId,
    });

    const ordersResponse = await polar.orders.list({
      customerId: customer.id,
    });

    return ordersResponse.result.items;
  },
  ["polar-orders-user"],
  {
    revalidate: 3600, // cache for 1 hour
    tags: ["polar-orders"],
  },
);

export async function getOrders() {
  const supabase = await createServerClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.user_metadata.is_pro) return [];

    const orders = await getCachedPolarOrders(user.id);

    return orders;
  } catch (error) {
    console.error("Polar API Error:", error);
    return [];
  }
}

export const generateReceipt = async (
  orderId: string,
): Promise<string | null> => {
  try {
    const receipt = await axios.get(
      `${POLAR_API_ORIGIN}/v1/orders/${orderId}/receipt`,
      {
        headers: {
          Authorization: `Bearer ${POLAR_ACCESS_TOKEN}`,
        },
      },
    );
    return receipt.data?.url;
  } catch (error) {
    console.error("Polar API Error:", error);
    return null;
  }
};
