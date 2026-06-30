import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export type SenderType = "customer" | "designer" | "bot";
export type MessageType = "text" | "image";

export interface Message {
    id: string;
    conversation_id: string;
    sender_type: SenderType;
    message_type: MessageType;
    text: string | null;
    image_url: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    sequence?: number;
}

// Fetch history — newest last, paginated via cursor (created_at)
export async function getMessages(conversationId: string, cursor?: string): Promise<Message[]> {
    let query = supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("sequence", { ascending: true })
        .limit(50);

    if (cursor) {
        query = query.lt("created_at", cursor);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as Message[];
}

// Send a text message
export async function sendTextMessage(conversationId: string, text: string): Promise<Message> {
    const { data, error } = await supabase
        .from("messages")
        .insert({
            conversation_id: conversationId,
            sender_type: "customer",
            message_type: "text",
            text: text.trim(),
        })
        .select()
        .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to send");
    return data as Message;
}

// Upload image to storage then insert message row
export async function sendImageMessage(conversationId: string, imageUri: string): Promise<Message> {
    // 1. Upload to Supabase Storage
    const fileName = `${conversationId}/${Date.now()}.jpg`;
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(fileName, blob, { contentType: "image/jpeg", upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    // 2. Get public URL
    const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(fileName);

    // 3. Insert message row
    const { data, error } = await supabase
        .from("messages")
        .insert({
            conversation_id: conversationId,
            sender_type: "customer",
            message_type: "image",
            image_url: urlData.publicUrl,
        })
        .select()
        .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to send image");
    return data as Message;
}

// Realtime subscription
export function subscribeToMessages(
    conversationId: string,
    onInsert: (msg: Message) => void,
    onUpdate: (msg: Message) => void
): RealtimeChannel {
    return supabase
        .channel(`messages:${conversationId}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
                console.log(`Realtime insert received:`, payload);
                onInsert(payload.new as Message);
            }
        )
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "messages",
                filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
                console.log(`Realtime update received:`, payload);
                onUpdate(payload.new as Message);
            }
        )
        .subscribe((status, err) => {
            if (status === "SUBSCRIBED") {
                console.log(`Successfully subscribed to messages for conversation: ${conversationId}`);
            } else if (status === "CHANNEL_ERROR") {
                console.error(`Failed to subscribe to messages for conversation: ${conversationId}`, err);
            } else {
                console.log(`Subscription status for conversation ${conversationId}:`, status);
            }
        });
}

export function unsubscribeFromMessages(channel: RealtimeChannel) {
    supabase.removeChannel(channel);
}
