import { supabase } from "@/lib/supabase";

export async function getCart(userId: string) {
    const { data: cart, error: cartError } = await supabase.from("carts").select("*").eq("user_id", userId).single();

    if (cartError) throw cartError;

    const { data: items, error: itemError } = await supabase.from("cart_items").select("*").eq("cart_id", cart.id);

    if (itemError) throw itemError;

    const cartItems = [];

    for (const item of items) {
        const { data: product } = await supabase.from("products").select("*").eq("id", item.product_id).single();

        const { data: customizations } = await supabase
            .from("cart_item_customizations")
            .select("*")
            .eq("cart_item_id", item.id);

        cartItems.push({
            ...item,
            product,
            customizations: customizations ?? [],
        });
    }

    return {
        ...cart,
        items: cartItems,
    };
}

interface Customization {
    field_key: string;
    field_label: string;
    selected_value: string;
}

interface AddToCartPayload {
    userId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    customizations: Customization[];
}

export async function addToCart(payload: AddToCartPayload) {
    let { data: cart } = await supabase.from("carts").select("*").eq("user_id", payload.userId).maybeSingle();

    if (!cart) {
        const { data } = await supabase
            .from("carts")
            .insert({
                user_id: payload.userId,
            })
            .select()
            .single();

        cart = data!;
    }

    const { data: cartItem, error } = await supabase
        .from("cart_items")
        .insert({
            cart_id: cart.id,
            product_id: payload.productId,
            quantity: payload.quantity,
            unit_price: payload.unitPrice,
        })
        .select()
        .single();

    if (error) throw error;

    if (payload.customizations.length) {
        await supabase.from("cart_item_customizations").insert(
            payload.customizations.map((item) => ({
                cart_item_id: cartItem.id,
                ...item,
            }))
        );
    }

    return cartItem;
}

export async function updateCartItem(cartItemId: string, quantity: number) {
    const { error } = await supabase
        .from("cart_items")
        .update({
            quantity,
        })
        .eq("id", cartItemId);

    if (error) throw error;
}

export async function removeCartItem(cartItemId: string) {
    const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);

    if (error) throw error;
}

export async function clearCart(cartId: string) {
    const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);

    if (error) throw error;
}

export async function getCartCount(cartId: string) {
    const { count, error } = await supabase
        .from("cart_items")
        .select("*", {
            count: "exact",
            head: true,
        })
        .eq("cart_id", cartId);

    if (error) throw error;

    return count ?? 0;
}
