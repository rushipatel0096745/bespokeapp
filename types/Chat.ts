export type SenderType = "customer" | "designer" | "bot";

export type MessageType = "text" | "image" | "system" | "quick_reply";

export interface Conversation {
    id: string;

    orderId: string;

    createdAt: string;

    order: {
        id: string;

        babyName: string;

        workflowStage: string;

        kitName: string;
    };
}

export interface Message {
    id: string;

    conversationId: string;

    senderType: SenderType;

    messageType: MessageType;

    text?: string;

    imageUrl?: string;

    metadata?: Record<string, any>;

    createdAt: string;
}
