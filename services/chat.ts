// modules/chat/services/chatService.ts

import { supabase } from "@/lib/supabase";
import { Conversation, Message } from "@/types/Chat";

export async function getConversation(orderId: string): Promise<Conversation> {
    const { data, error } = await supabase
        .from("conversations")
        .select(
            `
            id,
            created_at,
            orders (
                id,
                baby_name,
                workflow_stage,
                kits (
                    name
                )
            )
            `
        )
        .eq("order_id", orderId)
        .single();

    if (error) throw error;

    return {
        id: data.id,
        orderId,

        createdAt: data.created_at,

        order: {
            id: data.orders.id,
            babyName: data.orders.baby_name,
            workflowStage: data.orders.workflow_stage,
            kitName: data.orders.kits.name,
        },
    };
}

export async function getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", {
            ascending: true,
        });

    if (error) throw error;

    return (
        data?.map((message) => ({
            id: message.id,

            conversationId: message.conversation_id,

            senderType: message.sender_type,

            messageType: message.message_type,

            text: message.text,

            imageUrl: message.image_url,

            metadata: message.metadata,

            createdAt: message.created_at,
        })) ?? []
    );
}

interface SendMessagePayload {
    conversationId: string;

    senderType: "customer" | "designer" | "bot";

    messageType?: "text" | "image" | "system" | "quick_reply";

    text?: string;

    imageUrl?: string;

    metadata?: Record<string, any>;
}

export async function sendMessage(payload: SendMessagePayload): Promise<Message> {
    const { data, error } = await supabase
        .from("messages")
        .insert({
            conversation_id: payload.conversationId,

            sender_type: payload.senderType,

            message_type: payload.messageType ?? "text",

            text: payload.text ?? null,

            image_url: payload.imageUrl ?? null,

            metadata: payload.metadata ?? null,
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,

        conversationId: data.conversation_id,

        senderType: data.sender_type,

        messageType: data.message_type,

        text: data.text,

        imageUrl: data.image_url,

        metadata: data.metadata,

        createdAt: data.created_at,
    };
}

export async function createConversation(orderId: string) {
    const { data, error } = await supabase
        .from("conversations")
        .insert({
            order_id: orderId,
        })
        .select()
        .single();

    if (error) throw error;

    return data;
}

export async function sendWelcomeMessage(conversationId: string) {
    return sendMessage({
        conversationId,

        senderType: "bot",

        messageType: "system",

        text: "Thanks for submitting your prints! We've received them safely and our team is getting to work on your proof. While you're waiting (usually 1–2 working days), feel free to browse our exclusive add-ons.",

        metadata: {
            action: "browse_addons",
        },
    });
}
