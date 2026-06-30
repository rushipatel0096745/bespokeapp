export const chatKeys = {
    all: ["chat"] as const,

    conversation: (orderId: string) => [...chatKeys.all, "conversation", orderId] as const,

    messages: (conversationId: string) => [...chatKeys.all, "messages", conversationId] as const,
};
