import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = "comment" | "reaction" | "new_post" | "order_status";

export interface AppNotification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    body: string;
    data: Record<string, string> | null;
    read_at: string | null;
    created_at: string;
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const notificationKeys = {
    all: (userId: string) => ["notifications", userId] as const,
    unreadCount: (userId: string) => ["notifications", userId, "unread"] as const,
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchNotifications(userId: string): Promise<AppNotification[]> {
    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) throw new Error(error.message);
    return (data ?? []) as AppNotification[];
}

async function fetchUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null);

    if (error) throw new Error(error.message);
    return count ?? 0;
}

// ─── Mark as read ─────────────────────────────────────────────────────────────

async function markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .is("read_at", null); // only update if not already read
    if (error) throw new Error(error.message);
}

async function markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("read_at", null);
    if (error) throw new Error(error.message);
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useNotifications(userId: string | undefined) {
    const queryClient = useQueryClient();
    const channelRef = useRef<RealtimeChannel | null>(null);
    const mountIdRef = useRef(`${Date.now()}-${Math.random()}`);

    const query = useQuery({
        queryKey: notificationKeys.all(userId ?? ""),
        queryFn: () => fetchNotifications(userId!),
        enabled: !!userId,
        staleTime: 30_000,
    });

    // Realtime — new notification inserted
    useEffect(() => {
        if (!userId) return;

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        const channel = supabase
            .channel(`notifications:${userId}:${mountIdRef.current}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const newNotif = payload.new as AppNotification;

                    // Prepend to list
                    queryClient.setQueryData<AppNotification[]>(notificationKeys.all(userId), (prev) =>
                        prev ? [newNotif, ...prev] : [newNotif]
                    );

                    // Bump unread count
                    queryClient.setQueryData<number>(notificationKeys.unreadCount(userId), (prev) => (prev ?? 0) + 1);
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [userId]);

    // Mark single as read
    const { mutate: markRead } = useMutation({
        mutationFn: markAsRead,
        onSuccess: (_data, notificationId) => {
            queryClient.setQueryData<AppNotification[]>(notificationKeys.all(userId ?? ""), (prev) =>
                prev?.map((n) => (n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n))
            );
            // Refetch unread count
            queryClient.invalidateQueries({
                queryKey: notificationKeys.unreadCount(userId ?? ""),
            });
        },
    });

    // Mark all as read
    const { mutate: markAllRead, isPending: isMarkingAll } = useMutation({
        mutationFn: () => markAllAsRead(userId!),
        onSuccess: () => {
            const now = new Date().toISOString();
            queryClient.setQueryData<AppNotification[]>(notificationKeys.all(userId ?? ""), (prev) =>
                prev?.map((n) => ({ ...n, read_at: n.read_at ?? now }))
            );
            queryClient.setQueryData<number>(notificationKeys.unreadCount(userId ?? ""), 0);
        },
    });

    return {
        notifications: query.data ?? [],
        isLoading: query.isLoading,
        refetch: query.refetch,
        isRefetching: query.isRefetching,
        markRead,
        markAllRead,
        isMarkingAll,
    };
}

// Separate lightweight hook for the bell badge — used in home screen
export function useUnreadCount(userId: string | undefined) {
    return useQuery({
        queryKey: notificationKeys.unreadCount(userId ?? ""),
        queryFn: () => fetchUnreadCount(userId!),
        enabled: !!userId,
        staleTime: 60_000,
        refetchInterval: 60_000, // poll every minute as a safety net
    });
}
