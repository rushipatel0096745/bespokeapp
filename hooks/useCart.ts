// hooks/useCart.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartService } from "@/services/cart";
import type { Cart, CartItem, AddCartItemInput } from "@/types/Cart";

const cartKey = (orderId: string) => ["cart", orderId] as const;

// ---------------------------------------------------------
// useCart
// ---------------------------------------------------------
export function useCart(orderId: string | undefined) {
    return useQuery({
        queryKey: cartKey(orderId ?? ""),
        enabled: !!orderId,
        queryFn: () => cartService.fetchCart(orderId!),
        staleTime: 10_000,
    });
}

// ---------------------------------------------------------
// useAddToCart
// ---------------------------------------------------------
export function useAddToCart(orderId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: AddCartItemInput) => cartService.addCartItem(input),

        onMutate: async (input) => {
            await queryClient.cancelQueries({ queryKey: cartKey(orderId) });
            const previous = queryClient.getQueryData<Cart>(cartKey(orderId));

            if (previous) {
                const optimisticItem: CartItem = {
                    id: `optimistic-${Date.now()}`,
                    product_id: input.productId,
                    product: null,
                    quantity: input.quantity,
                    unit_price: input.unitPrice,
                    line_total: input.unitPrice * input.quantity,
                    created_at: new Date().toISOString(),
                    customizations: (input.customizations ?? []).map((c, i) => ({
                        id: `optimistic-c-${i}`,
                        ...c,
                    })),
                };

                queryClient.setQueryData<Cart>(cartKey(orderId), {
                    ...previous,
                    items: [...previous.items, optimisticItem],
                    total: previous.total + optimisticItem.line_total,
                });
            }

            return { previous };
        },

        onError: (_err, _input, context) => {
            if (context?.previous) {
                queryClient.setQueryData(cartKey(orderId), context.previous);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: cartKey(orderId) });
        },
    });
}

// ---------------------------------------------------------
// useUpdateCartItemQuantity
// ---------------------------------------------------------
export function useUpdateCartItemQuantity(orderId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) =>
            cartService.updateCartItemQuantity(cartItemId, quantity),

        onMutate: async ({ cartItemId, quantity }) => {
            await queryClient.cancelQueries({ queryKey: cartKey(orderId) });
            const previous = queryClient.getQueryData<Cart>(cartKey(orderId));

            if (previous) {
                const items =
                    quantity <= 0
                        ? previous.items.filter((i) => i.id !== cartItemId)
                        : previous.items.map((i) =>
                              i.id === cartItemId ? { ...i, quantity, line_total: i.unit_price * quantity } : i
                          );

                const total = items.reduce((sum, i) => sum + i.line_total, 0);
                queryClient.setQueryData<Cart>(cartKey(orderId), { ...previous, items, total });
            }

            return { previous };
        },

        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(cartKey(orderId), context.previous);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: cartKey(orderId) });
        },
    });
}

// ---------------------------------------------------------
// useRemoveCartItem
// ---------------------------------------------------------
export function useRemoveCartItem(orderId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (cartItemId: string) => cartService.removeCartItem(cartItemId),

        onMutate: async (cartItemId) => {
            await queryClient.cancelQueries({ queryKey: cartKey(orderId) });
            const previous = queryClient.getQueryData<Cart>(cartKey(orderId));

            if (previous) {
                const items = previous.items.filter((i) => i.id !== cartItemId);
                const total = items.reduce((sum, i) => sum + i.line_total, 0);
                queryClient.setQueryData<Cart>(cartKey(orderId), { ...previous, items, total });
            }

            return { previous };
        },

        onError: (_err, _id, context) => {
            if (context?.previous) {
                queryClient.setQueryData(cartKey(orderId), context.previous);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: cartKey(orderId) });
        },
    });
}
