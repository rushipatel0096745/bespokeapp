import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendTextMessage, sendImageMessage, Message } from "@/services/message";

// Shared optimistic insert helper
function buildOptimisticMessage(conversationId: string, overrides: Partial<Message>): Message {
    return {
        id: `optimistic-${Date.now()}`,
        conversation_id: conversationId,
        sender_type: "customer",
        message_type: "text",
        text: null,
        image_url: null,
        metadata: null,
        created_at: new Date().toISOString(),
        ...overrides,
    };
}

export function useSendMessage(conversationId: string) {
    const queryClient = useQueryClient();
    const queryKey = ["messages", conversationId];

    const textMutation = useMutation({
        mutationFn: (text: string) => sendTextMessage(conversationId, text),

        onMutate: async (text) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData<Message[]>(queryKey);

            const optimistic = buildOptimisticMessage(conversationId, {
                message_type: "text",
                text,
            });

            queryClient.setQueryData<Message[]>(queryKey, (prev) => [...(prev ?? []), optimistic]);

            return { previous, optimisticId: optimistic.id };
        },

        onSuccess: (confirmed, _text, ctx) => {
            // Replace optimistic entry with real one from DB
            queryClient.setQueryData<Message[]>(queryKey, (prev) =>
                (prev ?? []).map((m) => (m.id === ctx?.optimisticId ? confirmed : m))
            );
        },

        onError: (_err, _text, ctx) => {
            // Roll back
            if (ctx?.previous) {
                queryClient.setQueryData(queryKey, ctx.previous);
            }
        },
    });

    const imageMutation = useMutation({
        mutationFn: (imageUri: string) => sendImageMessage(conversationId, imageUri),

        onMutate: async (imageUri) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData<Message[]>(queryKey);

            const optimistic = buildOptimisticMessage(conversationId, {
                message_type: "image",
                image_url: imageUri, // local URI as placeholder
            });

            queryClient.setQueryData<Message[]>(queryKey, (prev) => [...(prev ?? []), optimistic]);

            return { previous, optimisticId: optimistic.id };
        },

        onSuccess: (confirmed, _uri, ctx) => {
            queryClient.setQueryData<Message[]>(queryKey, (prev) =>
                (prev ?? []).map((m) => (m.id === ctx?.optimisticId ? confirmed : m))
            );
        },

        onError: (_err, _uri, ctx) => {
            if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
        },
    });

    return {
        sendText: textMutation.mutate,
        sendImage: imageMutation.mutate,
        isSending: textMutation.isPending || imageMutation.isPending,
    };
}
