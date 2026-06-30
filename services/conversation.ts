import { supabase } from "@/lib/supabase";

export interface Conversation {
    id: string;
    order_id: string;
    created_at: string;
}

export async function getConversationByOrderId(orderId: string): Promise<Conversation> {
    const { data, error } = await supabase
        .from("conversations")
        .select("id, order_id, created_at")
        .eq("order_id", orderId)
        .single();

    if (error || !data) throw new Error("Conversation not found");
    return data as Conversation;
}
