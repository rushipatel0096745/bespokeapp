// hooks/useAddonOrders.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type AddonOrderItemCustomization = {
    id: string;
    field_key: string;
    field_label: string;
    selected_value: string;
};

export type AddonOrderItem = {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    customizations: AddonOrderItemCustomization[];
};

export type AddonOrder = {
    id: string;
    order_number: string;
    subtotal: number;
    discount: number;
    total: number;
    status: string;
    created_at: string;
    items: AddonOrderItem[];
};

async function fetchAddonOrders(orderId: string): Promise<AddonOrder[]> {
    // 1. Fetch all addon_orders for this order
    const { data: addonOrders, error: ordersError } = await supabase
        .from("addon_orders")
        .select("id, order_number, subtotal, discount, total, status, created_at")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

    if (ordersError) throw ordersError;
    if (!addonOrders || addonOrders.length === 0) return [];

    const addonOrderIds = addonOrders.map((o) => o.id);

    // 2. Fetch all items for those orders in one query
    const { data: items, error: itemsError } = await supabase
        .from("addon_order_items")
        .select("id, addon_order_id, product_name, quantity, unit_price, line_total")
        .in("addon_order_id", addonOrderIds);

    if (itemsError) throw itemsError;

    const allItems = items ?? [];
    const itemIds = allItems.map((i) => i.id);

    // 3. Fetch all customizations for those items in one query
    let customizationsByItem: Record<string, AddonOrderItemCustomization[]> = {};

    if (itemIds.length > 0) {
        const { data: customizations, error: customError } = await supabase
            .from("addon_order_item_customizations")
            .select("id, addon_order_item_id, field_key, field_label, selected_value")
            .in("addon_order_item_id", itemIds);

        if (customError) throw customError;

        customizationsByItem = (customizations ?? []).reduce(
            (acc, c) => {
                (acc[c.addon_order_item_id] ??= []).push(c);
                return acc;
            },
            {} as Record<string, AddonOrderItemCustomization[]>
        );
    }

    // 4. Assemble into nested structure
    const itemsByOrder = allItems.reduce(
        (acc, item) => {
            const full: AddonOrderItem = {
                id: item.id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                line_total: item.line_total,
                customizations: customizationsByItem[item.id] ?? [],
            };
            (acc[item.addon_order_id] ??= []).push(full);
            return acc;
        },
        {} as Record<string, AddonOrderItem[]>
    );

    return addonOrders.map((o) => ({
        ...o,
        items: itemsByOrder[o.id] ?? [],
    }));
}

export function useAddonOrders(orderId: string | undefined) {
    return useQuery({
        queryKey: ["addon_orders", orderId],
        enabled: !!orderId,
        queryFn: () => fetchAddonOrders(orderId!),
        staleTime: 30_000,
    });
}
