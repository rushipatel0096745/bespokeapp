import React, { useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { colors, typography, spacing, radii, shadows } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";
import { useNotifications, AppNotification, NotificationType } from "@/hooks/useInAppNotifications";
import { useAuth } from "@/context/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
    });
}

const TYPE_CONFIG: Record<NotificationType, { icon: string; label: string }> = {
    order_status: { icon: "📦", label: "Order update" },
    comment: { icon: "💬", label: "New comment" },
    reaction: { icon: "❤️", label: "Reaction" },
    new_post: { icon: "🌸", label: "New post" },
};

// Deep link based on notification type + data
function handleNotificationPress(notification: AppNotification) {
    const data = notification.data ?? {};
    console.log("notification", data);
    switch (notification.type) {
        case "order_status":
            if (data.order_id) router.push(`/orders/${data.order_id}`);
            break;
        case "comment":
        case "reaction":
            if (data.post_id) router.push(`/community/${data.post_id}`);
            break;
        case "new_post":
            if (data.post_id) router.push(`/community/${data.post_id}`);
            break;
    }
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotificationRow({ notification, onPress }: { notification: AppNotification; onPress: () => void }) {
    const isUnread = !notification.read_at;
    const config = TYPE_CONFIG[notification.type];

    return (
        <TouchableOpacity style={[styles.row, isUnread && styles.rowUnread]} onPress={onPress} activeOpacity={0.7}>
            {/* Unread dot */}
            {isUnread && <View style={styles.unreadDot} />}

            {/* Type icon */}
            <View style={[styles.iconWrap, isUnread && styles.iconWrapUnread]}>
                <Text style={styles.icon}>{config.icon}</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.contentHeader}>
                    <Text style={styles.typeLabel}>{config.label}</Text>
                    <Text style={styles.timestamp}>{timeAgo(notification.created_at)}</Text>
                </View>
                <Text style={[styles.title, isUnread && styles.titleUnread]}>{notification.title}</Text>
                <Text style={styles.body} numberOfLines={2}>
                    {notification.body}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyBody}>
                We'll let you know when your proof is ready or there's activity in the community.
            </Text>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
    const { profile } = useAuth();
    const userId = profile?.id;

    const { notifications, isLoading, refetch, isRefetching, markRead, markAllRead, isMarkingAll } =
        useNotifications(userId);

    const hasUnread = notifications.some((n) => !n.read_at);

    const handlePress = useCallback(
        (notification: AppNotification) => {
            // Mark as read then navigate
            if (!notification.read_at) {
                markRead(notification.id);
            }
            handleNotificationPress(notification);
        },
        [markRead]
    );

    const MarkAllButton = hasUnread ? (
        <TouchableOpacity
            onPress={() => markAllRead()}
            disabled={isMarkingAll}
            style={styles.markAllBtn}
            activeOpacity={0.7}>
            <Text style={styles.markAllText}>{isMarkingAll ? "Marking…" : "Mark all read"}</Text>
        </TouchableOpacity>
    ) : undefined;

    return (
        <ScreenWrapper
            scrollable={false}
            header={<NavBar variant='back' title='Notifications' rightElement={MarkAllButton} />}>
            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size='large' color={colors.gold} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(n) => n.id}
                    renderItem={({ item }) => <NotificationRow notification={item} onPress={() => handlePress(item)} />}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={<EmptyState />}
                    contentContainerStyle={[styles.listContent, notifications.length === 0 && styles.listContentEmpty]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.gold} />
                    }
                />
            )}
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    listContent: {
        paddingVertical: spacing.sm,
        paddingBottom: spacing.section,
    },
    listContentEmpty: {
        flexGrow: 1,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
    },

    // Row
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.white,
        gap: spacing.md,
    },
    rowUnread: {
        backgroundColor: colors.goldPale,
    },
    unreadDot: {
        position: "absolute",
        left: spacing.sm,
        top: spacing.lg + 2,
        width: 6,
        height: 6,
        borderRadius: radii.full,
        backgroundColor: colors.gold,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: radii.full,
        backgroundColor: colors.creamMid,
        alignItems: "center",
        justifyContent: "center",
    },
    iconWrapUnread: {
        backgroundColor: colors.goldLight + "40",
    },
    icon: {
        fontSize: 18,
    },
    content: {
        flex: 1,
        gap: spacing.xxs,
    },
    contentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    typeLabel: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xxs,
        color: colors.charcoalLight,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    timestamp: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xxs,
        color: colors.charcoalLight,
    },
    title: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.charcoalMid,
    },
    titleUnread: {
        fontFamily: typography.fonts.sansBold,
        color: colors.charcoal,
    },
    body: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
        lineHeight: typography.sizes.sm * 1.5,
    },

    // Mark all
    markAllBtn: {
        backgroundColor: colors.gold,
        borderRadius: radii.full,
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xs,
        minWidth: 100,
        alignItems: "center",
    },
    markAllText: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.sm,
        color: colors.charcoal,
    },

    // Empty
    emptyWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.xxxl,
        gap: spacing.sm,
    },
    emptyEmoji: {
        fontSize: 40,
        marginBottom: spacing.sm,
    },
    emptyTitle: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.lg,
        color: colors.charcoal,
        textAlign: "center",
    },
    emptyBody: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
        textAlign: "center",
        lineHeight: typography.sizes.md * 1.6,
    },
});
