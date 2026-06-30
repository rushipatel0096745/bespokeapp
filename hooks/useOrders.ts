import { useQuery } from "@tanstack/react-query";
import { getOrders } from "@/services/order";
import { orderKeys } from "@/services/orderKeys";
import { useAuth } from "@/context/AuthContext";

export function useOrders() {
    const { user } = useAuth();

    return useQuery({
        queryKey: orderKeys.list(user?.id ?? ""),
        queryFn: () => getOrders(user!.id),
        enabled: !!user,
    });
}
