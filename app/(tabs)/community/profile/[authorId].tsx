import React from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { colors, typography, spacing, radii } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";
import { AuthorAvatar } from "@/components/community/AuthorAvatar";
import { PostCard } from "@/components/community/PostCard";
import { useAuthorProfile, useAuthorPostCount, useFeed } from "@/hooks/useCommunity";
import { useAuth } from "@/context/AuthContext";
import type { CommunityPost } from "@/types/Community";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMemberSince(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
    });
}

// ─── Header component ─────────────────────────────────────────────────────────

function ProfileHeader({ authorId, postCount }: { authorId: string; postCount: number | undefined }) {
    const { data: author, isLoading } = useAuthorProfile(authorId);

    if (isLoading) {
        return (
            <View style={styles.headerLoader}>
                <ActivityIndicator size='small' color={colors.gold} />
            </View>
        );
    }

    if (!author) return null;

    const fullName = [author.first_name, author.last_name].filter(Boolean).join(" ");

    return (
        <View style={styles.profileHeader}>
            <AuthorAvatar
                firstName={author.first_name}
                lastName={author.last_name}
                avatarUrl={author.avatar_url}
                size='lg'
            />
            <Text style={styles.fullName}>{fullName}</Text>
            <Text style={styles.memberSince}>Member since {formatMemberSince(author.created_at)}</Text>

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{postCount ?? "—"}</Text>
                    <Text style={styles.statLabel}>Posts</Text>
                </View>
            </View>

            <View style={styles.postsSectionLabel}>
                <Text style={styles.postsSectionLabelText}>Posts</Text>
            </View>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AuthorProfileScreen() {
    const { authorId } = useLocalSearchParams<{ authorId: string }>();
    const { profile } = useAuth();
    const currentUserId = profile?.id;

    const { data: postCountData } = useAuthorPostCount(authorId);

    // Reuse the feed query but filter to this author client-side.
    // In a real app you'd have a dedicated authorPosts query — wire up
    // communityService.fetchAuthorPosts(authorId) when ready.
    const { data: feedData, isLoading: feedLoading } = useFeed(currentUserId);

    const authorPosts = feedData?.pages.flatMap((p) => p.posts).filter((p) => p.author_id === authorId) ?? [];

    const isOwnProfile = authorId === currentUserId;

    // ── Redirect own profile to the app profile screen ────────────────────────
    // Uncomment this if you want own-profile taps to redirect:
    // if (isOwnProfile) { router.replace("/profile"); return null; }

    const renderPost = ({ item }: { item: CommunityPost }) => (
        <PostCard
            post={item}
            currentUserId={currentUserId}
            onPress={() => router.push(`/community/${item.id}`)}
            // No onAuthorPress — we're already on their profile
        />
    );

    return (
        <ScreenWrapper
            scrollable={false}
            header={
                <NavBar
                    variant='back'
                    title=''
                    rightElement={
                        isOwnProfile ? (
                            <TouchableOpacity onPress={() => router.push("/profile")} style={styles.editProfileBtn}>
                                <Text style={styles.editProfileBtnText}>Edit profile</Text>
                            </TouchableOpacity>
                        ) : undefined
                    }
                />
            }>
            {feedLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size='large' color={colors.gold} />
                </View>
            ) : (
                <FlatList
                    data={authorPosts}
                    keyExtractor={(p) => p.id}
                    renderItem={renderPost}
                    ListHeaderComponent={<ProfileHeader authorId={authorId!} postCount={postCountData} />}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyText}>No posts yet.</Text>
                        </View>
                    }
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
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
    headerLoader: {
        paddingVertical: spacing.xl,
        alignItems: "center",
    },
    profileHeader: {
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: 0,
        gap: spacing.xs,
    },
    fullName: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.xxl,
        color: colors.charcoal,
        marginTop: spacing.sm,
    },
    memberSince: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.charcoalLight,
    },
    statsRow: {
        flexDirection: "row",
        gap: spacing.xxl,
        paddingVertical: spacing.md,
        marginTop: spacing.xs,
    },
    stat: {
        alignItems: "center",
        gap: spacing.xxs,
    },
    statValue: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.xxl,
        color: colors.charcoal,
    },
    statLabel: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    postsSectionLabel: {
        alignSelf: "stretch",
        paddingVertical: spacing.sm,
        marginTop: spacing.xs,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        backgroundColor: colors.creamMid,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    postsSectionLabelText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    listContent: {
        paddingBottom: spacing.section,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginHorizontal: spacing.lg,
    },
    emptyWrap: {
        paddingVertical: spacing.xxl,
        alignItems: "center",
    },
    emptyText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
    },
    editProfileBtn: {
        paddingHorizontal: spacing.xs,
    },
    editProfileBtnText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.gold,
    },
});
