// services/cartService.ts
import { supabase } from "@/lib/supabase"; // adjust to your actual client path
import type { Cart, CartItem, AddCartItemInput } from "@/types/Cart";

// ---------------------------------------------------------
// getOrCreateCart
// Returns the existing cart row for an order, or creates one.
// ---------------------------------------------------------
async function getOrCreateCart(orderId: string) {
    const { data: existing, error: fetchError } = await supabase
        .from("carts")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();

    if (fetchError) throw fetchError;
    if (existing) return existing;

    const { data: created, error: createError } = await supabase
        .from("carts")
        .insert({ order_id: orderId, status: "active" })
        .select("*")
        .single();

    if (createError) throw createError;
    return created;
}

// ---------------------------------------------------------
// getCartItems
// ---------------------------------------------------------
async function getCartItems(cartId: string) {
    const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("cart_id", cartId)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

// ---------------------------------------------------------
// getProductsByIds
// Used to join product name/image onto cart items for display.
// Adjust the selected columns to match your `products` table.
// ---------------------------------------------------------
async function getProductsByIds(productIds: string[]) {
    if (productIds.length === 0) return {} as Record<string, { id: string; name: string; image_url: string | null }>;

    const uniqueIds = [...new Set(productIds)];

    const { data, error } = await supabase.from("products").select("id, name, image_url").in("id", uniqueIds);

    if (error) throw error;

    return (data ?? []).reduce(
        (acc, p) => {
            acc[p.id] = p;
            return acc;
        },
        {} as Record<string, { id: string; name: string; image_url: string | null }>
    );
}

// ---------------------------------------------------------
// getCustomizationsForItems
// ---------------------------------------------------------
async function getCustomizationsForItems(cartItemIds: string[]) {
    if (cartItemIds.length === 0) return {} as Record<string, CartItem["customizations"]>;

    const { data, error } = await supabase.from("cart_item_customizations").select("*").in("cart_item_id", cartItemIds);

    if (error) throw error;

    return (data ?? []).reduce(
        (acc, c) => {
            (acc[c.cart_item_id] ??= []).push(c);
            return acc;
        },
        {} as Record<string, CartItem["customizations"]>
    );
}

// ---------------------------------------------------------
// fetchCart
// Assembles cart + items + customizations into the Cart shape.
// Assumes the cart already exists — call getOrCreateCart first.
// ---------------------------------------------------------
async function fetchCart(orderId: string): Promise<Cart> {
    const cartRow = await getOrCreateCart(orderId);
    const items = await getCartItems(cartRow.id);
    const [customizationsByItem, productsById] = await Promise.all([
        getCustomizationsForItems(items.map((i) => i.id)),
        getProductsByIds(items.map((i) => i.product_id)),
    ]);

    const fullItems: CartItem[] = items.map((i) => ({
        id: i.id,
        product_id: i.product_id,
        product: productsById[i.product_id] ?? null,
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_total: i.unit_price * i.quantity,
        created_at: i.created_at,
        customizations: customizationsByItem[i.id] ?? [],
    }));

    return {
        id: cartRow.id,
        order_id: cartRow.order_id,
        status: cartRow.status,
        created_at: cartRow.created_at,
        updated_at: cartRow.updated_at,
        total: fullItems.reduce((sum, i) => sum + i.line_total, 0),
        items: fullItems,
    };
}

// ---------------------------------------------------------
// addCartItem
// Uses the add_cart_item RPC so the item insert + customization
// inserts happen atomically server-side.
// ---------------------------------------------------------
async function addCartItem(input: AddCartItemInput): Promise<string> {
    const { data, error } = await supabase.rpc("add_cart_item", {
        p_cart_id: input.cartId,
        p_product_id: input.productId,
        p_quantity: input.quantity,
        p_unit_price: input.unitPrice,
        p_customizations: input.customizations ?? [],
    });

    if (error) throw error;
    return data as string; // new cart_item id
}

// ---------------------------------------------------------
// updateCartItemQuantity
// quantity <= 0 deletes the row.
// ---------------------------------------------------------
async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
        const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
        if (error) throw error;
        return;
    }

    const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", cartItemId);

    if (error) throw error;
}

// ---------------------------------------------------------
// removeCartItem
// Customizations cascade via the FK.
// ---------------------------------------------------------
async function removeCartItem(cartItemId: string): Promise<void> {
    const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
    if (error) throw error;
}

export const cartService = {
    getOrCreateCart,
    getCartItems,
    getCustomizationsForItems,
    getProductsByIds,
    fetchCart,
    addCartItem,
    updateCartItemQuantity,
    removeCartItem,
};
