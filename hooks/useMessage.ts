import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getMessages, subscribeToMessages, unsubscribeFromMessages, Message } from "@/services/message";
import { RealtimeChannel } from "@supabase/supabase-js";

export function useMessages(conversationId: string | undefined) {
    const queryClient = useQueryClient();
    const channelRef = useRef<RealtimeChannel | null>(null);

    const query = useQuery({
        queryKey: ["messages", conversationId],
        queryFn: () => getMessages(conversationId!),
        enabled: !!conversationId,
        staleTime: 0,
    });

    useEffect(() => {
        if (!conversationId) return;

        // Subscribe to realtime inserts
        channelRef.current = subscribeToMessages(
            conversationId,
            // (newMsg) => {
            //     queryClient.setQueryData<Message[]>(["messages", conversationId], (prev) => {
            //         if (!prev) return [newMsg];
            //         // Deduplicate — optimistic message may already be in the list
            //         const exists = prev.some((m) => m.id === newMsg.id);
            //         return exists ? prev : [...prev, newMsg];
            //     });
            // },
            (newMsg) => {
                queryClient.setQueryData<Message[]>(["messages", conversationId], (prev) => {
                    if (!prev) return [newMsg];
                    const exists = prev.some((m) => m.id === newMsg.id);
                    if (exists) return prev;
                    return [...prev, newMsg].sort((a, b) => (a?.sequence || 0) - (b?.sequence || 0));
                });
            },
            (updatedMsg) => {
                queryClient.setQueryData<Message[]>(["messages", conversationId], (prev) => {
                    if (!prev) return prev;
                    return prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m));
                });
            }
        );

        return () => {
            if (channelRef.current) {
                unsubscribeFromMessages(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [conversationId]);

    return query;
}
