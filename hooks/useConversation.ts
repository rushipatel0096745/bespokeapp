import { useQuery } from "@tanstack/react-query";
import { getConversationByOrderId } from "@/services/conversation";

export function useConversation(orderId: string) {
    return useQuery({
        queryKey: ["conversation", orderId],
        queryFn: () => getConversationByOrderId(orderId),
        enabled: !!orderId,
        staleTime: Infinity, // conversation ID never changes for an order
    });
}
