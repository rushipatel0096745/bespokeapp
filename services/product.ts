import { supabase } from "@/lib/supabase";
import { Product, ProductField, ProductFieldOption, ProductFieldWithOptions } from "@/types/Product";

export async function getProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from("products").select("*").eq("is_active", true).order("display_order");

    if (error) throw error;

    return data ?? [];
}

export async function getProductBySlug(slug: string): Promise<Product> {
    const { data, error } = await supabase.from("products").select("*").eq("slug", slug).single();

    if (error) throw error;

    return data;
}

export async function getProductFields(productId: string): Promise<ProductFieldWithOptions[]> {
    const { data: fields, error } = await supabase
        .from("product_fields")
        .select("*")
        .eq("product_id", productId)
        .order("display_order");

    if (error) throw error;

    const result: ProductFieldWithOptions[] = [];

    for (const field of fields as ProductField[]) {
        const { data: options } = await supabase
            .from("product_field_options")
            .select("*")
            .eq("field_id", field.id)
            .order("display_order");

        result.push({
            ...field,
            options: (options ?? []) as ProductFieldOption[],
        });
    }

    return result;
}
