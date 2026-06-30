import { View, Text, FlatList, Pressable, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";

import { useOrders } from "@/hooks/useOrders";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";
import { colors, typography, spacing, radii, shadows } from "@/theme/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderWorkflowStage =
    | "submitted"
    | "proof_pending"
    | "proof_sent"
    | "changes_requested"
    | "approved"
    | "upsell_offered"
    | "foiling"
    | "dispatched"
    | "completed";

export interface OrderImage {
    id: string;
    image_url: string;
    sort_order: number;
}

export interface Order {
    id: string;
    user_id: string;
    website_order_id: string;
    kit_id: string;
    status: string;
    workflow_stage: OrderWorkflowStage;
    zendesk_ticket_id: string | null;
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    baby_name: string;
    date_of_birth: string | null;
    print_type: string;
    frame_colour_id: string | null;
    foil_colour_id: string | null;
    card_colour_id: string | null;
    special_instructions: string | null;
    revision_count: number;
    submitted_at: string;
    created_at: string;
    updated_at: string;
    kits: {
        id: string;
        name: string;
    };
    order_images: OrderImage[];
}

// ─── Status config ────────────────────────────────────────────────────────────

export const ORDER_STATUS: Record<OrderWorkflowStage, { label: string; color: string; background: string; dot: string }> = {
    submitted: { label: "Submitted", color: "#92650A", background: "#FEF3C7", dot: "#D97706" },
    proof_pending: { label: "Proof Pending", color: "#92650A", background: "#FEF3C7", dot: "#D97706" },
    proof_sent: { label: "Proof Ready", color: "#1D4ED8", background: "#DBEAFE", dot: "#2563EB" },
    changes_requested: { label: "Changes Requested", color: "#9A3412", background: "#FED7AA", dot: "#EA580C" },
    approved: { label: "Approved", color: "#15803D", background: "#DCFCE7", dot: "#16A34A" },
    upsell_offered: { label: "Add-ons Available", color: "#6D28D9", background: "#F3E8FF", dot: "#7C3AED" },
    foiling: { label: "Foiling", color: "#6D28D9", background: "#F3E8FF", dot: "#7C3AED" },
    dispatched: { label: "Dispatched", color: "#1D4ED8", background: "#DBEAFE", dot: "#2563EB" },
    completed: { label: "Completed", color: "#15803D", background: "#DCFCE7", dot: "#16A34A" },
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ stage }: { stage: OrderWorkflowStage }) {
    const s = ORDER_STATUS[stage] ?? ORDER_STATUS.submitted;
    return (
        <View style={[badge.root, { backgroundColor: s.background }]}>
            <View style={[badge.dot, { backgroundColor: s.dot }]} />
            <Text style={[badge.label, { color: s.color }]}>{s.label}</Text>
        </View>
    );
}

const badge = StyleSheet.create({
    root: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radii.full,
        gap: spacing.xs,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    label: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xs,
        letterSpacing: typography.letterSpacing.wide,
    },
});

// ─── OrderCard ────────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
    const router = useRouter();
    const thumbnail = order.order_images?.[0]?.image_url ?? null;

    const submittedDate = new Date(order.submitted_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    return (
        <Pressable
            onPress={() => router.push(`/orders/${order.id}`)}
            style={({ pressed }) => [card.root, pressed && card.rootPressed]}>
            {/* Thumbnail */}
            <Image
                source={thumbnail ? { uri: thumbnail } : require("@/assets/order-placeholder.png")}
                style={card.thumbnail}
            />

            {/* Content */}
            <View style={card.content}>
                {/* Kit name + baby name */}
                <Text style={card.kitName} numberOfLines={1}>
                    {order.kits.name}
                </Text>
                <Text style={card.babyName}>{order.baby_name}</Text>

                {/* Status + unread dot row */}
                <View style={card.statusRow}>
                    <StatusBadge stage={order.workflow_stage} />
                </View>

                {/* Meta row: print type · submitted date */}
                <View style={card.metaRow}>
                    <Text style={card.metaText}>
                        {order.print_type.charAt(0).toUpperCase() + order.print_type.slice(1)} print
                    </Text>
                    <Text style={card.metaDivider}>·</Text>
                    <Text style={card.metaText}>{submittedDate}</Text>
                </View>
            </View>

            {/* Chevron */}
            <Text style={card.chevron}>›</Text>
        </Pressable>
    );
}

const card = StyleSheet.create({
    root: {
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        borderWidth: 0.5,
        borderColor: colors.border,
        padding: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        ...shadows.card,
    },
    rootPressed: {
        backgroundColor: colors.creamMid,
    },
    thumbnail: {
        width: 68,
        height: 68,
        borderRadius: radii.lg,
        backgroundColor: colors.creamMid,
    },
    content: {
        flex: 1,
        gap: spacing.xs,
    },
    kitName: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
    },
    babyName: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
    },
    statusRow: {
        marginTop: spacing.xs,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        marginTop: spacing.xs,
    },
    metaText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
    },
    metaDivider: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.border,
    },
    chevron: {
        fontSize: 22,
        color: colors.charcoalLight,
        marginLeft: spacing.xs,
    },
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OrderCardSkeleton() {
    return (
        <View style={skeleton.root}>
            <View style={skeleton.thumbnail} />
            <View style={skeleton.content}>
                <View style={[skeleton.line, { width: "55%" }]} />
                <View style={[skeleton.line, { width: "35%", marginTop: spacing.xs }]} />
                <View style={[skeleton.line, { width: "45%", marginTop: spacing.sm }]} />
                <View style={[skeleton.line, { width: "65%", marginTop: spacing.xs }]} />
            </View>
        </View>
    );
}

const skeleton = StyleSheet.create({
    root: {
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        borderWidth: 0.5,
        borderColor: colors.border,
        padding: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    thumbnail: {
        width: 68,
        height: 68,
        borderRadius: radii.lg,
        backgroundColor: colors.creamMid,
    },
    content: { flex: 1 },
    line: {
        height: 13,
        borderRadius: radii.xs,
        backgroundColor: colors.creamMid,
    },
});

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <View style={empty.root}>
            <Text style={empty.emoji}>🖐️</Text>
            <Text style={empty.heading}>No orders yet</Text>
            <Text style={empty.body}>Upload your first print kit to get started.</Text>
        </View>
    );
}

const empty = StyleSheet.create({
    root: {
        marginTop: spacing.section * 2,
        alignItems: "center",
        paddingHorizontal: spacing.xxxl,
        gap: spacing.sm,
    },
    emoji: {
        fontSize: 40,
        marginBottom: spacing.sm,
    },
    heading: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.xl,
        color: colors.charcoal,
    },
    body: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.base,
        color: colors.charcoalLight,
        textAlign: "center",
        lineHeight: typography.sizes.base * 1.6,
    },
});

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <View style={err.root}>
            <Text style={err.heading}>Something went wrong</Text>
            <Text style={err.body}>We couldn't load your orders.</Text>
            <Pressable onPress={onRetry} style={err.btn}>
                <Text style={err.btnText}>Try again</Text>
            </Pressable>
        </View>
    );
}

const err = StyleSheet.create({
    root: {
        marginTop: spacing.section * 2,
        alignItems: "center",
        gap: spacing.sm,
        paddingHorizontal: spacing.xxxl,
    },
    heading: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.lg,
        color: colors.charcoal,
    },
    body: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.base,
        color: colors.charcoalLight,
        textAlign: "center",
    },
    btn: {
        marginTop: spacing.md,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.charcoal,
    },
    btnText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.base,
        color: colors.charcoal,
    },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OrdersScreen() {
    const { data: orders, isLoading, isError, refetch, isRefetching } = useOrders();

    return (
        <ScreenWrapper scrollable={false} header={<NavBar title='Orders' showBackButton={false} />}>
            <FlatList
                data={isLoading ? ([1, 2, 3] as const) : (orders ?? [])}
                keyExtractor={(item) => (isLoading ? String(item) : (item as Order).id)}
                contentContainerStyle={screen.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) =>
                    isLoading ? <OrderCardSkeleton /> : isError ? null : <OrderCard order={item as Order} />
                }
                ListEmptyComponent={isError ? <ErrorState onRetry={refetch} /> : <EmptyState />}
                refreshing={isRefetching}
                onRefresh={refetch}
            />
        </ScreenWrapper>
    );
}


const screen = StyleSheet.create({
    list: {
        padding: spacing.lg,
        gap: spacing.md,
        flexGrow: 1,
    },
});
