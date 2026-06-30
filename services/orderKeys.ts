// services/orderKeys.ts

export const orderKeys = {
    all: ["orders"] as const,

    lists: () => [...orderKeys.all, "list"] as const,

    list: (userId: string) =>
        [...orderKeys.lists(), userId] as const,

    details: () => [...orderKeys.all, "detail"] as const,

    detail: (orderId: string) =>
        [...orderKeys.details(), orderId] as const,
};