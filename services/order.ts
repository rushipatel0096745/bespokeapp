import { supabase } from "@/lib/supabase";

export async function getOrders(userId: string) {
    const { data, error } = await supabase
        .from("orders")
        .select(
            `
            *,
            kits (
                id,
                name
            ),
            order_images (
                id,
                image_url,
                sort_order
            )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) throw error;

    return data ?? [];
}

export async function getOrder(orderId: string) {
    const { data, error } = await supabase
        .from("orders")
        .select(
            `
            *,
            kits (
                id,
                name,
                description,
                includes_frame,
                includes_presentation_box,
                includes_affirmation_card
            ),
            order_images (
                id,
                image_url,
                image_type,
                sort_order
            )
        `
        )
        .eq("id", orderId)
        .single();

    if (error) throw error;

    return data;
}

export async function getOrderImages(orderId: string) {
    const { data, error } = await supabase.from("order_images").select("*").eq("order_id", orderId).order("sort_order");

    if (error) throw error;

    return data ?? [];
}

export async function updateWorkflowStage(orderId: string, workflowStage: string) {
    const { error } = await supabase
        .from("orders")
        .update({
            workflow_stage: workflowStage,
        })
        .eq("id", orderId);

    if (error) throw error;
}

export async function updateRevisionCount(orderId: string, revisionCount: number) {
    const { error } = await supabase
        .from("orders")
        .update({
            revision_count: revisionCount,
        })
        .eq("id", orderId);

    if (error) throw error;
}
