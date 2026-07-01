import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import React, { useCallback } from "react";
import { router } from "expo-router";
import { colors, typography, spacing, radii, shadows } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";
import { PostCard } from "@/components/community/PostCard";
import { useFeed } from "@/hooks/useCommunity";
import { useAuth } from "@/context/AuthContext";
import type { CommunityPost } from "@/types/Community";

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyFeed() {
    return (
        <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🌸</Text>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>Be the first to share something with the community.</Text>
        </View>
    );
}

// ─── Footer loader ────────────────────────────────────────────────────────────

function FooterLoader() {
    return (
        <View style={styles.footerLoader}>
            <ActivityIndicator size='small' color={colors.gold} />
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CommunityFeedScreen() {
    const { profile } = useAuth();
    const currentUserId = profile?.id;

    const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch, isRefetching } =
        useFeed(currentUserId);

    const posts = data?.pages.flatMap((p) => p.posts) ?? [];

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const renderPost = useCallback(
        ({ item }: { item: CommunityPost }) => {
            console.log(item.image_url);
            return (
                <PostCard
                    post={item}
                    currentUserId={currentUserId}
                    onPress={() => router.push(`/community/${item.id}`)}
                    onAuthorPress={() => router.push(`/community/profile/${item.author_id}`)}
                />
            );
        },
        [currentUserId]
    );

    const keyExtractor = useCallback((item: CommunityPost) => item.id, []);

    const onRefresh = useCallback(async () => {
        await refetch();
    }, [refetch]);

    return (
        <ScreenWrapper scrollable={false} header={<NavBar title='Community' showBackButton={false} />}>
            {isLoading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size='large' color={colors.gold} />
                </View>
            ) : (
                <FlatList
                    data={posts}
                    renderItem={renderPost}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={[styles.listContent, posts.length === 0 && styles.listContentEmpty]}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={<EmptyFeed />}
                    ListFooterComponent={isFetchingNextPage ? <FooterLoader /> : null}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.4}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.gold} />
                    }
                />
            )}

            {/* Compose FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push("/community/compose")}
                activeOpacity={0.85}
                accessibilityRole='button'
                accessibilityLabel='Write a post'>
                <Text style={styles.fabIcon}>✏️</Text>
            </TouchableOpacity>
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    loadingWrap: {
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
        marginHorizontal: spacing.lg,
    },
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
    footerLoader: {
        paddingVertical: spacing.lg,
        alignItems: "center",
    },
    fab: {
        position: "absolute",
        bottom: 120,
        // bottom: spacing.xxl,
        right: spacing.lg,
        width: 52,
        height: 52,
        borderRadius: radii.full,
        backgroundColor: colors.gold,
        alignItems: "center",
        justifyContent: "center",
        ...shadows.nav,
    },
    fabIcon: {
        fontSize: 20,
    },
});
