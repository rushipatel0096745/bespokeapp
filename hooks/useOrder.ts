import { useQuery } from "@tanstack/react-query";
import { getOrder } from "@/services/order";
import { orderKeys } from "@/services/orderKeys";

export function useOrder(orderId?: string) {
    return useQuery({
        queryKey: orderKeys.detail(orderId ?? ""),
        queryFn: () => getOrder(orderId!),
        enabled: !!orderId,
    });
}
