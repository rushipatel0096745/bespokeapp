import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { colors, typography, spacing, radii, componentStyles } from "../theme/theme";

// Layout
import ScreenWrapper from "../components/layout/ScreenWrapper";
import NavBar from "../components/layout/NavBar";
import PromoBanner from "../components/layout/PromoBanner";

// UI primitives
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";

// Types (will live in types/ folder)
import type { Order } from "../types/Order";
import type { Post } from "../types/Post";

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={componentStyles.sectionTitle}>{title}</Text>
            {subtitle && <Text style={componentStyles.sectionSubtitle}>{subtitle}</Text>}
        </View>
    );
}

// ─── Active order card ────────────────────────────────────────────────────────

const STATUS_LABELS: Record<Order["status"], string> = {
    proof_ready: "Proof ready for review",
    awaiting_proof: "Proof being prepared",
    approved: "Approved — being foiled",
    dispatched: "Dispatched",
};

const STATUS_BADGE: Record<Order["status"], "gold" | "grey" | "success"> = {
    proof_ready: "gold",
    awaiting_proof: "grey",
    approved: "success",
    dispatched: "success",
};

function ActiveOrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
    return (
        <Card variant='default' onPress={onPress} style={styles.orderCard}>
            <View style={styles.orderCardRow}>
                <View style={styles.orderCardLeft}>
                    <Text style={styles.orderCardTitle}>
                        Baby {order.babyName} — {order.printType}
                    </Text>
                    <Badge
                        label={STATUS_LABELS[order.status]}
                        variant={STATUS_BADGE[order.status]}
                        style={styles.orderBadge}
                    />
                    <Text style={styles.orderCardDate}>Submitted {order.submittedAt}</Text>
                </View>

                {order.status === "proof_ready" && (
                    <View style={styles.reviewPill}>
                        <Text style={styles.reviewPillText}>Review</Text>
                    </View>
                )}
            </View>
        </Card>
    );
}

// ─── Daily tip card ───────────────────────────────────────────────────────────

function DailyTipCard({ quote }: { quote: string }) {
    return (
        <Card variant='gold' style={styles.tipCard}>
            <Text style={styles.tipQuote}>"{quote}"</Text>
        </Card>
    );
}

// ─── Community post preview ───────────────────────────────────────────────────

function CommunityPostPreview({ post }: { post: Post }) {
    return (
        <Card variant='default' style={styles.postCard}>
            <View style={styles.postRow}>
                <Avatar name={post.author} size='sm' />
                <View style={styles.postContent}>
                    <Text style={styles.postAuthor}>{post.author}</Text>
                    <Text style={styles.postText} numberOfLines={2}>
                        {post.content}
                    </Text>
                    <Text style={styles.postMeta}>
                        {post.reactions} reactions · {post.createdAt}
                    </Text>
                </View>
            </View>
        </Card>
    );
}

// ─── Upload CTA ───────────────────────────────────────────────────────────────

function UploadCTA({ onPress }: { onPress: () => void }) {
    return (
        <Card variant='gold' onPress={onPress} style={styles.uploadCard}>
            <View style={styles.uploadRow}>
                {/* Replace ↑ with Ionicons cloud-upload-outline */}
                <Text style={styles.uploadIcon}>↑</Text>
                <View style={styles.uploadText}>
                    <Text style={styles.uploadTitle}>Upload your prints</Text>
                    <Text style={styles.uploadSub}>Proof ready in 1–2 working days</Text>
                </View>
            </View>
        </Card>
    );
}

// ─── Notification bell (right-slot of NavBar) ─────────────────────────────────

function BellButton({ onPress, unread }: { onPress: () => void; unread?: boolean }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            accessibilityLabel={unread ? "Notifications — unread" : "Notifications"}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {/* Replace with Ionicons notifications-outline */}
            <Text style={styles.bellIcon}>🔔</Text>
            {unread && <View style={styles.bellDot} />}
        </TouchableOpacity>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
    const router = useRouter();

    // ── Replace with hooks/useOrders.ts, hooks/useDailyTip.ts, hooks/useCommunityFeed.ts ──
    const activeOrder: Order = {
        id: "ord_001",
        ticketId: "BFC-2024-0441",
        babyName: "Ava",
        printType: "hand + foot",
        status: "proof_ready",
        submittedAt: "2 days ago",
    };

    const dailyTip = {
        quote: "The days are long but the years are short. Capture every tiny detail.",
    };

    const communityPosts: Post[] = [
        {
            id: "post_001",
            author: "Sarah M.",
            content:
                "Just received our foil prints and I genuinely cried — they are absolutely perfect. Worth every penny.",
            reactions: 24,
            createdAt: "2h ago",
        },
        {
            id: "post_002",
            author: "Jess T.",
            content: "Anyone ordered the keyring add-on? Thinking of getting one for my mum.",
            reactions: 8,
            createdAt: "4h ago",
        },
        {
            id: "post_003",
            author: "Emma R.",
            content: "Second time ordering — the team are so lovely and patient with changes.",
            reactions: 16,
            createdAt: "6h ago",
        },
    ];
    // ──────────────────────────────────────────────────────────────────────────

    return (
        <ScreenWrapper
            scrollable
            withTabBar
            header={
                <>
                    <NavBar
                        variant='logo'
                        rightElement={<BellButton onPress={() => router.push("/notifications")} unread />}
                    />
                    <PromoBanner text='Spend £40 or more and get 20% off!' />
                </>
            }>
            <View style={styles.body}>
                {/* Active order */}
                <SectionHeader title='Your order' subtitle='Tap to open your proof chat' />
                <ActiveOrderCard
                    order={activeOrder}
                    onPress={() => router.push(`/orders/${activeOrder.ticketId}/chat`)}
                />

                {/* Upload CTA */}
                <UploadCTA onPress={() => router.push("/upload")} />
                <UploadCTA onPress={() => router.push("/add-ons")} />

                {/* Daily tip */}
                <SectionHeader title='Daily tip' />
                <DailyTipCard quote={dailyTip.quote} />

                {/* Community preview */}
                <View style={styles.communityHeader}>
                    <SectionHeader title='Community' subtitle='What mums are saying' />
                    <TouchableOpacity onPress={() => router.push("/(tabs)/community")} accessibilityRole='link'>
                        <Text style={styles.seeAllLink}>See all</Text>
                    </TouchableOpacity>
                </View>

                {communityPosts.map((post) => (
                    <CommunityPostPreview key={post.id} post={post} />
                ))}
            </View>
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    body: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        gap: spacing.sm,
    },

    // Section header
    sectionHeader: {
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },

    // Order card
    orderCard: {
        // Card handles its own bg + border
    },
    orderCardRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    orderCardLeft: {
        flex: 1,
        gap: spacing.xs,
    },
    orderCardTitle: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.base,
        color: colors.charcoal,
    },
    orderBadge: {
        // Badge handles its own alignment
    },
    orderCardDate: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
    },
    reviewPill: {
        backgroundColor: colors.gold,
        borderRadius: radii.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        marginLeft: spacing.sm,
    },
    reviewPillText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xs,
        color: colors.charcoal,
    },

    // Tip card
    tipCard: {
        // Card gold variant handles border
    },
    tipQuote: {
        fontFamily: typography.fonts.serif,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
        lineHeight: typography.sizes.md * 1.55,
    },

    // Community
    communityHeader: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginTop: spacing.md,
    },
    seeAllLink: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.gold,
        paddingBottom: 2, // optical alignment with subtitle
    },

    // Post card
    postCard: {
        // Card handles bg + border
    },
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

    // Upload CTA
    uploadCard: {
        marginTop: spacing.xs,
    },
    uploadRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    uploadIcon: {
        fontSize: 24,
        color: colors.charcoal,
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

    // Bell
    bellIcon: {
        fontSize: 20,
    },
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
});

// // screens/HomeScreen.tsx
// // Modern Mum Co — Home Screen
// // Uses theme.ts for all styling

// import React from "react";
// import {
//     View,
//     Text,
//     ScrollView,
//     TouchableOpacity,
//     StyleSheet,
//     StatusBar,
//     // SafeAreaView,
//     Image,
//     FlatList,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { colors, typography, spacing, radii, shadows, componentStyles } from "../../theme/theme";
// import { SafeAreaView } from "react-native-safe-area-context";

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface Order {
//     id: string;
//     ticketId: string;
//     babyName: string;
//     printType: string;
//     status: "proof_ready" | "awaiting_proof" | "approved" | "dispatched";
//     submittedAt: string;
// }

// interface Post {
//     id: string;
//     author: string;
//     content: string;
//     reactions: number;
//     createdAt: string;
// }

// interface DailyTip {
//     id: string;
//     quote: string;
// }

// // ─── Status helpers ───────────────────────────────────────────────────────────

// const STATUS_LABELS: Record<Order["status"], string> = {
//     proof_ready: "Proof ready for review",
//     awaiting_proof: "Proof being prepared",
//     approved: "Approved — being foiled",
//     dispatched: "Dispatched",
// };

// const STATUS_COLORS: Record<Order["status"], string> = {
//     proof_ready: colors.gold,
//     awaiting_proof: colors.charcoalLight,
//     approved: colors.success,
//     dispatched: colors.success,
// };

// // ─── Sub-components ───────────────────────────────────────────────────────────

// function NavBar() {
//     return (
//         <View style={styles.navBar}>
//             <Text style={styles.navLogo}>Modern Mum Co®</Text>
//             <TouchableOpacity style={styles.navIconBtn} accessibilityLabel='Notifications'>
//                 {/* Replace with expo/vector-icons bell icon */}
//                 <Text style={styles.navIconText}>🔔</Text>
//             </TouchableOpacity>
//         </View>
//     );
// }

// function PromoBanner({ text }: { text: string }) {
//     return (
//         <View style={componentStyles.promoBanner}>
//             <Text style={componentStyles.promoBannerText}>{text}</Text>
//         </View>
//     );
// }

// function ActiveOrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
//     return (
//         <TouchableOpacity
//             style={styles.orderCard}
//             onPress={onPress}
//             activeOpacity={0.8}
//             accessibilityRole='button'
//             accessibilityLabel={`View order for ${order.babyName}`}>
//             <View style={styles.orderCardLeft}>
//                 <Text style={styles.orderCardTitle}>
//                     Baby {order.babyName} — {order.printType}
//                 </Text>
//                 <Text style={[styles.orderCardStatus, { color: STATUS_COLORS[order.status] }]}>
//                     {STATUS_LABELS[order.status]}
//                 </Text>
//                 <Text style={styles.orderCardDate}>Submitted {order.submittedAt}</Text>
//             </View>
//             {order.status === "proof_ready" && (
//                 <View style={styles.reviewBadge}>
//                     <Text style={styles.reviewBadgeText}>Review</Text>
//                 </View>
//             )}
//         </TouchableOpacity>
//     );
// }

// function DailyTipCard({ tip }: { tip: DailyTip }) {
//     return (
//         <View style={styles.tipCard}>
//             <Text style={styles.tipQuote}>"{tip.quote}"</Text>
//         </View>
//     );
// }

// function CommunityPostPreview({ post }: { post: Post }) {
//     return (
//         <View style={styles.postCard}>
//             <View style={styles.postAvatar}>
//                 <Text style={styles.postAvatarText}>{post.author.charAt(0)}</Text>
//             </View>
//             <View style={styles.postContent}>
//                 <Text style={styles.postAuthor}>{post.author}</Text>
//                 <Text style={styles.postText} numberOfLines={2}>
//                     {post.content}
//                 </Text>
//                 <Text style={styles.postMeta}>
//                     {post.reactions} reactions · {post.createdAt}
//                 </Text>
//             </View>
//         </View>
//     );
// }

// function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
//     return (
//         <View style={styles.sectionHeader}>
//             <Text style={componentStyles.sectionTitle}>{title}</Text>
//             {subtitle && <Text style={componentStyles.sectionSubtitle}>{subtitle}</Text>}
//         </View>
//     );
// }

// function UploadCTA({ onPress }: { onPress: () => void }) {
//     return (
//         <TouchableOpacity
//             style={styles.uploadCTA}
//             onPress={onPress}
//             activeOpacity={0.85}
//             accessibilityRole='button'
//             accessibilityLabel='Upload your prints'>
//             <View style={styles.uploadCTAInner}>
//                 {/* Replace with Ionicons or MaterialIcons upload icon */}
//                 <Text style={styles.uploadCTAIcon}>↑</Text>
//                 <View>
//                     <Text style={styles.uploadCTATitle}>Upload your prints</Text>
//                     <Text style={styles.uploadCTASub}>Proof ready in 1–2 working days</Text>
//                 </View>
//             </View>
//         </TouchableOpacity>
//     );
// }

// // ─── Main Screen ──────────────────────────────────────────────────────────────

// export default function HomeScreen() {
//     const router = useRouter();

//     // Replace with real data from Supabase + Zendesk hooks
//     const activeOrder: Order = {
//         id: "ord_001",
//         ticketId: "BFC-2024-0441",
//         babyName: "Ava",
//         printType: "hand + foot",
//         status: "proof_ready",
//         submittedAt: "2 days ago",
//     };

//     const dailyTip: DailyTip = {
//         id: "tip_001",
//         quote: "The days are long but the years are short. Capture every tiny detail.",
//     };

//     const communityPosts: Post[] = [
//         {
//             id: "post_001",
//             author: "Sarah M.",
//             content:
//                 "Just received our foil prints and I genuinely cried — they are absolutely perfect. Worth every penny.",
//             reactions: 24,
//             createdAt: "2h ago",
//         },
//         {
//             id: "post_002",
//             author: "Jess T.",
//             content: "Anyone ordered the keyring add-on? Thinking of getting one for my mum.",
//             reactions: 8,
//             createdAt: "4h ago",
//         },
//         {
//             id: "post_003",
//             author: "Emma R.",
//             content: "Second time ordering — the team are so lovely and patient with changes.",
//             reactions: 16,
//             createdAt: "6h ago",
//         },
//     ];

//     const handleOrderPress = () => {
//         router.push(`/orders/${activeOrder.ticketId}`);
//     };

//     const handleUploadPress = () => {
//         router.push("/upload");
//     };

//     const handleCommunityPress = () => {
//         router.push("/community");
//     };

//     return (
//         <SafeAreaView style={styles.safe}  edges={["top"]}>
//             <StatusBar barStyle='light-content' backgroundColor={colors.charcoal} />

//             <NavBar />
//             <PromoBanner text='Spend £40 or more and get 20% off!' />

//             <ScrollView
//                 style={styles.scroll}
//                 showsVerticalScrollIndicator={false}
//                 contentContainerStyle={styles.scrollContent}>
//                 {/* Active order */}
//                 <SectionHeader title='Your order' subtitle='Tap to open your proof chat' />
//                 <ActiveOrderCard order={activeOrder} onPress={handleOrderPress} />

//                 {/* Upload CTA */}
//                 <UploadCTA onPress={handleUploadPress} />

//                 {/* Daily tip */}
//                 <SectionHeader title='Daily tip' />
//                 <DailyTipCard tip={dailyTip} />

//                 {/* Community preview */}
//                 <View style={styles.communityHeader}>
//                     <SectionHeader title='Community' subtitle='What mums are saying' />
//                     <TouchableOpacity onPress={handleCommunityPress} accessibilityRole='link'>
//                         <Text style={styles.seeAllLink}>See all</Text>
//                     </TouchableOpacity>
//                 </View>
//                 {communityPosts.map((post) => (
//                     <CommunityPostPreview key={post.id} post={post} />
//                 ))}

//                 {/* Bottom padding for tab bar */}
//                 <View style={{ height: spacing.xxxl }} />
//             </ScrollView>
//         </SafeAreaView>
//     );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────

// const styles = StyleSheet.create({
//     safe: {
//         flex: 1,
//         backgroundColor: colors.charcoal,
//     },

//     scroll: {
//         flex: 1,
//         backgroundColor: colors.cream,
//     },

//     scrollContent: {
//         paddingTop: spacing.lg,
//     },

//     // Nav
//     navBar: {
//         ...componentStyles.navBar,
//     },

//     navLogo: {
//         ...componentStyles.navLogo,
//     },

//     navIconBtn: {
//         padding: spacing.xs,
//     },

//     navIconText: {
//         fontSize: typography.sizes.lg,
//     },

//     // Section header
//     sectionHeader: {
//         paddingHorizontal: spacing.lg,
//         marginBottom: spacing.sm,
//     },

//     communityHeader: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         alignItems: "flex-end",
//         paddingRight: spacing.lg,
//     },

//     seeAllLink: {
//         fontFamily: typography.fonts.sansMedium,
//         fontSize: typography.sizes.sm,
//         color: colors.gold,
//         marginBottom: spacing.xs,
//     },

//     // Active order card
//     orderCard: {
//         ...componentStyles.card,
//         marginHorizontal: spacing.lg,
//         marginBottom: spacing.lg,
//         flexDirection: "row",
//         justifyContent: "space-between",
//         alignItems: "center",
//         ...shadows.card,
//     },

//     orderCardLeft: {
//         flex: 1,
//     },

//     orderCardTitle: {
//         fontFamily: typography.fonts.sansMedium,
//         fontSize: typography.sizes.md,
//         color: colors.charcoal,
//         marginBottom: spacing.xxs,
//     },

//     orderCardStatus: {
//         fontFamily: typography.fonts.sans,
//         fontSize: typography.sizes.sm,
//         marginBottom: spacing.xxs,
//     },

//     orderCardDate: {
//         fontFamily: typography.fonts.sans,
//         fontSize: typography.sizes.xs,
//         color: colors.charcoalLight,
//     },

//     reviewBadge: {
//         backgroundColor: colors.gold,
//         borderRadius: radii.full,
//         paddingVertical: spacing.xxs,
//         paddingHorizontal: spacing.sm,
//         marginLeft: spacing.md,
//     },

//     reviewBadgeText: {
//         fontFamily: typography.fonts.sansMedium,
//         fontSize: typography.sizes.xxs,
//         color: colors.white,
//         letterSpacing: typography.letterSpacing.wide,
//     },

//     // Upload CTA
//     uploadCTA: {
//         marginHorizontal: spacing.lg,
//         marginBottom: spacing.lg,
//         borderRadius: radii.md,
//         borderWidth: 0.5,
//         borderColor: colors.borderGold,
//         backgroundColor: colors.goldPale,
//         padding: spacing.lg,
//     },

//     uploadCTAInner: {
//         flexDirection: "row",
//         alignItems: "center",
//         gap: spacing.md,
//     },

//     uploadCTAIcon: {
//         fontSize: typography.sizes.xxl,
//         color: colors.gold,
//         fontWeight: "300",
//     },

//     uploadCTATitle: {
//         fontFamily: typography.fonts.sansMedium,
//         fontSize: typography.sizes.md,
//         color: colors.charcoal,
//     },

//     uploadCTASub: {
//         fontFamily: typography.fonts.sans,
//         fontSize: typography.sizes.xs,
//         color: colors.charcoalLight,
//         marginTop: spacing.xxs,
//     },

//     // Daily tip
//     tipCard: {
//         ...componentStyles.cardGold,
//         marginHorizontal: spacing.lg,
//         marginBottom: spacing.lg,
//     },

//     tipQuote: {
//         fontFamily: typography.fonts.sans,
//         fontSize: typography.sizes.base,
//         color: colors.charcoalMid,
//         lineHeight: typography.sizes.base * typography.lineHeights.loose,
//         fontStyle: "italic",
//     },

//     // Community posts
//     postCard: {
//         ...componentStyles.card,
//         marginHorizontal: spacing.lg,
//         marginBottom: spacing.sm,
//         flexDirection: "row",
//         gap: spacing.md,
//         ...shadows.card,
//     },

//     postAvatar: {
//         width: 36,
//         height: 36,
//         borderRadius: radii.full,
//         backgroundColor: colors.creamMid,
//         borderWidth: 0.5,
//         borderColor: colors.border,
//         alignItems: "center",
//         justifyContent: "center",
//         flexShrink: 0,
//     },

//     postAvatarText: {
//         fontFamily: typography.fonts.sansMedium,
//         fontSize: typography.sizes.md,
//         color: colors.charcoalMid,
//     },

//     postContent: {
//         flex: 1,
//     },

//     postAuthor: {
//         fontFamily: typography.fonts.sansMedium,
//         fontSize: typography.sizes.sm,
//         color: colors.charcoal,
//         marginBottom: spacing.xxs,
//     },

//     postText: {
//         fontFamily: typography.fonts.sans,
//         fontSize: typography.sizes.base,
//         color: colors.charcoalMid,
//         lineHeight: typography.sizes.base * typography.lineHeights.normal,
//         marginBottom: spacing.xs,
//     },

//     postMeta: {
//         fontFamily: typography.fonts.sans,
//         fontSize: typography.sizes.xs,
//         color: colors.charcoalLight,
//     },
// });
