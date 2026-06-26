import { useQuery } from "@tanstack/react-query";
import { getProducts, getProductBySlug, getProductFields } from "@/services/product";
import { ProductFieldWithOptions, Product } from "@/types/Product";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const productKeys = {
    all: ["products"] as const,
    lists: () => [...productKeys.all, "list"] as const,
    detail: (slug: string) => [...productKeys.all, "detail", slug] as const,
    fields: (productId: string) => [...productKeys.all, "fields", productId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetches all active products — used on the product listing screen.
 */
export function useProducts() {
    return useQuery({
        queryKey: productKeys.lists(),
        queryFn: getProducts,
        staleTime: 1000 * 60 * 5, // 5 min — product list rarely changes mid-session
    });
}

/**
 * Fetches a single product by slug — used on the product detail screen.
 */
export function useProduct(slug: string) {
    return useQuery({
        queryKey: productKeys.detail(slug),
        queryFn: () => getProductBySlug(slug),
        enabled: Boolean(slug),
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Fetches all fields + options for a product — used on the detail screen
 * to render dynamic form inputs (dropdowns, radio buttons, etc.)
 *
 * Automatically enabled once we have a productId (i.e. after useProduct resolves).
 */
export function useProductFields(productId: string | undefined) {
    return useQuery({
        queryKey: productKeys.fields(productId ?? ""),
        queryFn: () => getProductFields(productId!),
        enabled: Boolean(productId),
        staleTime: 1000 * 60 * 10, // fields are very stable
    });
}

/**
 * Convenience hook for the product detail screen — fetches product + its
 * fields in one call. Returns a unified loading/error state.
 *
 * Usage:
 *   const { product, fields, isLoading, error } = useProductDetail("some-slug");
 */
export function useProductDetail(slug: string) {
    const productQuery = useProduct(slug);
    const fieldsQuery = useProductFields(productQuery.data?.id);

    const isLoading = productQuery.isLoading || fieldsQuery.isLoading;
    const isFetching = productQuery.isFetching || fieldsQuery.isFetching;
    const error = productQuery.error ?? fieldsQuery.error;

    return {
        product: productQuery.data as Product | undefined,
        fields: fieldsQuery.data as ProductFieldWithOptions[] | undefined,
        isLoading,
        isFetching,
        error,
    };
}
