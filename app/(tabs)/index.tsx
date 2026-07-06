import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { colors, typography, spacing, radii, componentStyles } from "../../theme/theme";
import ScreenWrapper from "../../components/layout/ScreenWrapper";
import NavBar from "../../components/layout/NavBar";
import PromoBanner from "../../components/layout/PromoBanner";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { AuthorAvatar } from "@/components/community/AuthorAvatar";
import { useOrders } from "@/hooks/useOrders";
import { useFeed } from "@/hooks/useCommunity";
import { useAuth } from "@/context/AuthContext";
import { useUnreadCount } from "@/hooks/useInAppNotifications";
import { ORDER_STATUS, OrderWorkflowStage } from "../(tabs)/orders";
import type { CommunityPost } from "@/types/Community";
import { Ionicons } from "@expo/vector-icons";

// ─── Daily tips — 30 rotating cards ──────────────────────────────────────────

const DAILY_TIPS = [
    "The days are long but the years are short. Capture every tiny detail.",
    "You are doing better than you think, mama.",
    "There is no such thing as a perfect parent — just a present one.",
    "Every cuddle you give is wiring their brain for love.",
    "Rest is not a reward. It is a requirement.",
    "Your baby doesn't need a perfect mum. They need you.",
    "Small moments make the biggest memories.",
    "Asking for help is not weakness — it is wisdom.",
    "You grew a human. Never forget how powerful you are.",
    "Babies are only little for a little while.",
    "It's okay to not enjoy every moment. Parenthood is hard.",
    "Your love is the most important thing in their world.",
    "One day at a time. Sometimes one hour at a time.",
    "The laundry can wait. The snuggles cannot.",
    "You are exactly the parent your child needs.",
    "Growth happens in the quiet moments.",
    "Trust your instincts — you know your baby best.",
    "Some days surviving is enough.",
    "Every stage passes. Even the hard ones.",
    "Comparison is the thief of joy. Run your own race.",
    "You don't have to earn rest.",
    "Holding them close is never a waste of time.",
    "The mess means you're living.",
    "Your baby's first home was your heartbeat.",
    "Imperfect action beats perfect inaction every time.",
    "Celebrate the small wins. They add up.",
    "You are allowed to feel all of it — joy and exhaustion at once.",
    "The love you pour in now will last a lifetime.",
    "Motherhood is the hardest and most beautiful thing.",
    "Today you are enough. Tomorrow you will be enough too.",
];

function getDailyTip(): string {
    // Rotates through 30 tips based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
    title,
    subtitle,
    action,
    onAction,
}: {
    title: string;
    subtitle?: string;
    action?: string;
    onAction?: () => void;
}) {
    return (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
                <Text style={componentStyles.sectionTitle}>{title}</Text>
                {subtitle && <Text style={componentStyles.sectionSubtitle}>{subtitle}</Text>}
            </View>
            {action && onAction && (
                <TouchableOpacity onPress={onAction} accessibilityRole='link'>
                    <Text style={styles.seeAllLink}>{action}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ─── Bell button ──────────────────────────────────────────────────────────────

function BellButton({ onPress, unread }: { onPress: () => void; unread?: boolean }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            accessibilityLabel={unread ? "Notifications — unread" : "Notifications"}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name='notifications-outline' size={22} color={colors.white} />
            {unread && <View style={styles.bellDot} />}
        </TouchableOpacity>
    );
}

// ─── Active order card ────────────────────────────────────────────────────────

function ActiveOrderCard({ order, onPress }: { order: any; onPress: () => void }) {
    const stage = order.workflow_stage as OrderWorkflowStage;
    const statusConfig = ORDER_STATUS[stage];

    return (
        <Card variant='default' onPress={onPress} style={styles.orderCard}>
            <View style={styles.orderCardRow}>
                <View style={styles.orderCardLeft}>
                    <Text style={styles.orderKitName}>{order.kits?.name ?? "Your order"}</Text>
                    <Text style={styles.orderCardTitle}>
                        {order.baby_name}
                        {order.print_type ? ` — ${order.print_type}` : ""}
                    </Text>
                    <View style={styles.orderBadgeWrap}>
                        <View style={[styles.statusDot, { backgroundColor: statusConfig?.dot ?? colors.gold }]} />
                        <Text style={[styles.statusLabel, { color: statusConfig?.color ?? colors.charcoal }]}>
                            {statusConfig?.label ?? stage}
                        </Text>
                    </View>
                    <Text style={styles.orderCardDate}>
                        Submitted{" "}
                        {new Date(order.submitted_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                        })}
                    </Text>
                </View>

                <Ionicons name='chevron-forward' size={16} color={colors.charcoalLight} />
            </View>
        </Card>
    );
}

// ─── Daily tip card ───────────────────────────────────────────────────────────

function DailyTipCard() {
    const tip = useMemo(() => getDailyTip(), []);
    return (
        <Card variant='gold' style={styles.tipCard}>
            <Text style={styles.tipLabel}>Daily reminder</Text>
            <Text style={styles.tipQuote}>"{tip}"</Text>
        </Card>
    );
}

// ─── Community post preview ───────────────────────────────────────────────────

function CommunityPostPreview({ post, onPress }: { post: CommunityPost; onPress: () => void }) {
    const authorName = [post.author.first_name, post.author.last_name].filter(Boolean).join(" ");
    const totalReactions = post.reactions.total;

    return (
        <Card variant='default' onPress={onPress} style={styles.postCard}>
            <View style={styles.postRow}>
                <AuthorAvatar
                    firstName={post.author.first_name}
                    lastName={post.author.last_name}
                    avatarUrl={post.author.avatar_url}
                    size='sm'
                />
                <View style={styles.postContent}>
                    <Text style={styles.postAuthor}>{authorName}</Text>
                    <Text style={styles.postText} numberOfLines={2}>
                        {post.body}
                    </Text>
                    <Text style={styles.postMeta}>
                        {totalReactions > 0 ? `${totalReactions} reaction${totalReactions !== 1 ? "s" : ""} · ` : ""}
                        {post.comment_count > 0
                            ? `${post.comment_count} comment${post.comment_count !== 1 ? "s" : ""} · `
                            : ""}
                        {timeAgo(post.created_at)}
                    </Text>
                </View>
            </View>
        </Card>
    );
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const ACTIVE_STAGES: OrderWorkflowStage[] = [
    "submitted",
    "proof_pending",
    "proof_sent",
    "changes_requested",
    "approved",
    "foiling",
];

export default function HomeScreen() {
    const router = useRouter();
    const { profile } = useAuth();
    const { data: unreadCount = 0 } = useUnreadCount(profile?.id);

    const { data: orders = [], isLoading: ordersLoading } = useOrders();
    const { data: feedData, isLoading: feedLoading } = useFeed(profile?.id);

    // Filter to active (non-completed, non-dispatched) orders
    const activeOrders = orders.filter((o: any) => ACTIVE_STAGES.includes(o.workflow_stage as OrderWorkflowStage));

    // Most recent 3 community posts
    const recentPosts = feedData?.pages[0]?.posts.slice(0, 3) ?? [];

    return (
        <ScreenWrapper
            scrollable
            withTabBar
            header={
                <>
                    <NavBar
                        variant='logo'
                        rightElement={
                            <BellButton onPress={() => router.push("/notifications")} unread={unreadCount > 0} />
                        }
                    />
                    <PromoBanner text='Spend £40 or more and get 20% off!' />
                </>
            }>
            <View style={styles.body}>
                {/* ── Active orders ── */}
                <SectionHeader
                    title='Your orders'
                    subtitle='Tap to open your proof chat'
                    action={orders.length > activeOrders.length ? "See all" : undefined}
                    onAction={() => router.push("/(tabs)/orders")}
                />

                {ordersLoading ? (
                    <ActivityIndicator color={colors.gold} style={styles.loader} />
                ) : activeOrders.length === 0 ? (
                    <Card variant='default' style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No active orders right now.</Text>
                    </Card>
                ) : (
                    activeOrders.map((order: any) => (
                        <ActiveOrderCard
                            key={order.id}
                            order={order}
                            onPress={() => router.push(`/orders/${order.id}`)}
                        />
                    ))
                )}

                {/* ── Upload CTA ── */}
                <Card variant='gold' onPress={() => router.push("/upload")} style={styles.uploadCard}>
                    <View style={styles.uploadRow}>
                        <Ionicons name='cloud-upload-outline' size={24} color={colors.charcoal} />
                        <View style={styles.uploadText}>
                            <Text style={styles.uploadTitle}>Upload your prints</Text>
                            <Text style={styles.uploadSub}>Proof ready in 1–2 working days</Text>
                        </View>
                        <Ionicons name='chevron-forward' size={16} color={colors.charcoalMid} />
                    </View>
                </Card>

                {/* ── Daily tip ── */}
                <SectionHeader title='Daily reminder' />
                <DailyTipCard />

                {/* ── Community preview ── */}
                <SectionHeader
                    title='Community'
                    subtitle='What mums are saying'
                    action='See all'
                    onAction={() => router.push("/(tabs)/community")}
                />

                {feedLoading ? (
                    <ActivityIndicator color={colors.gold} style={styles.loader} />
                ) : recentPosts.length === 0 ? (
                    <Card variant='default' style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No posts yet — be the first to share!</Text>
                    </Card>
                ) : (
                    recentPosts.map((post) => (
                        <CommunityPostPreview
                            key={post.id}
                            post={post}
                            onPress={() => router.push(`/community/${post.id}`)}
                        />
                    ))
                )}
            </View>
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    body: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.section,
        gap: spacing.sm,
    },
    loader: {
        paddingVertical: spacing.lg,
    },

    // Section header
    sectionHeader: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    sectionHeaderLeft: {
        gap: 2,
    },
    seeAllLink: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.gold,
        paddingBottom: 2,
    },

    // Bell
    bellDot: {
        position: "absolute",
        top: 0,
        right: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.error,
        borderWidth: 1.5,
        borderColor: colors.charcoal,
    },

    // Order card
    orderCard: {
        marginBottom: spacing.xs,
    },
    orderCardRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.sm,
    },
    orderCardLeft: {
        flex: 1,
        gap: spacing.xs,
    },
    orderKitName: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.base,
        color: colors.charcoal,
    },
    orderCardTitle: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalMid,
    },
    orderBadgeWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusLabel: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xs,
        letterSpacing: typography.letterSpacing.wide,
    },
    orderCardDate: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
    },

    // Daily tip
    tipCard: {},
    tipLabel: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
        letterSpacing: typography.letterSpacing.wide,
        textTransform: "uppercase",
        marginBottom: spacing.xs,
    },
    tipQuote: {
        fontFamily: typography.fonts.serif,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
        lineHeight: typography.sizes.md * 1.6,
    },

    // Upload CTA
    uploadCard: {
        marginTop: spacing.xs,
    },
    uploadRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    uploadText: {
        flex: 1,
    },
    uploadTitle: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.base,
        color: colors.charcoal,
    },
    uploadSub: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
        marginTop: 2,
    },

    // Community post
    postCard: {},
    postRow: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    postContent: {
        flex: 1,
        gap: 3,
    },
    postAuthor: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.charcoal,
    },
    postText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
        lineHeight: typography.sizes.sm * 1.5,
    },
    postMeta: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
        opacity: 0.7,
    },

    // Empty states
    emptyCard: {},
    emptyText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
        textAlign: "center",
        paddingVertical: spacing.sm,
    },
});
