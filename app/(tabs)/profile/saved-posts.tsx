import React, { useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, radii } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";
import { AuthorAvatar } from "@/components/community/AuthorAvatar";
import { useSavedPosts, useToggleSave } from "@/hooks/useCommunity";
import { useAuth } from "@/context/AuthContext";
import type { SavedPost } from "@/types/Community";

const BODY_PREVIEW_LINES = 2;

// ─── Saved post row ───────────────────────────────────────────────────────────

function SavedPostRow({ item, onUnsave }: { item: SavedPost; onUnsave: () => void }) {
    const authorName = [item.post.author.first_name, item.post.author.last_name].filter(Boolean).join(" ");

    return (
        <TouchableOpacity
            style={styles.row}
            onPress={() => router.push(`/community/${item.post.id}`)}
            activeOpacity={0.7}>
            {/* Left: author avatar + text */}
            <View style={styles.rowContent}>
                <View style={styles.rowHeader}>
                    <AuthorAvatar
                        firstName={item.post.author.first_name}
                        lastName={item.post.author.last_name}
                        avatarUrl={item.post.author.avatar_url}
                        size='sm'
                    />
                    <Text style={styles.authorName} numberOfLines={1}>
                        {authorName}
                    </Text>
                </View>

                <Text style={styles.bodyPreview} numberOfLines={BODY_PREVIEW_LINES}>
                    {item.post.body}
                </Text>
            </View>

            {/* Right: image thumbnail (if any) + unsave button */}
            <View style={styles.rowRight}>
                {item.post.image_url && (
                    <Image source={{ uri: item.post.image_url }} style={styles.thumbnail} resizeMode='cover' />
                )}
                <TouchableOpacity onPress={onUnsave} hitSlop={8} activeOpacity={0.7} style={styles.unsaveBtn}>
                    <Ionicons name='bookmark' size={18} color={colors.gold} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <View style={styles.emptyWrap}>
            <Ionicons name='bookmark-outline' size={40} color={colors.border} />
            <Text style={styles.emptyTitle}>No saved posts yet</Text>
            <Text style={styles.emptyBody}>Tap the bookmark icon on any post to save it here.</Text>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SavedPostsScreen() {
    const { profile } = useAuth();
    const currentUserId = profile?.id;

    const { data: savedPosts = [], isLoading } = useSavedPosts(currentUserId);

    const renderItem = useCallback(
        ({ item }: { item: SavedPost }) => {
            return <SavedPostRowWrapper item={item} currentUserId={currentUserId!} />;
        },
        [currentUserId]
    );

    return (
        <ScreenWrapper scrollable={false} header={<NavBar variant='back' title='Saved posts' />}>
            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size='large' color={colors.gold} />
                </View>
            ) : (
                <FlatList
                    data={savedPosts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ListEmptyComponent={<EmptyState />}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    contentContainerStyle={[styles.listContent, savedPosts.length === 0 && styles.listContentEmpty]}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </ScreenWrapper>
    );
}

// Isolated so each row owns its own useToggleSave instance
function SavedPostRowWrapper({ item, currentUserId }: { item: SavedPost; currentUserId: string }) {
    const toggleSave = useToggleSave(item.post.id);

    const handleUnsave = useCallback(() => {
        toggleSave.mutate({ userId: currentUserId, isSaved: true });
    }, [currentUserId, toggleSave]);

    return <SavedPostRow item={item} onUnsave={handleUnsave} />;
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
        marginHorizontal: spacing.lg,
    },
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    rowContent: {
        flex: 1,
        gap: spacing.xs,
    },
    rowHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    authorName: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.charcoal,
        flex: 1,
    },
    bodyPreview: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.base,
        color: colors.charcoalMid,
        lineHeight: typography.sizes.base * 1.5,
    },
    rowRight: {
        alignItems: "center",
        gap: spacing.sm,
    },
    thumbnail: {
        width: 72,
        height: 72,
        borderRadius: radii.md,
        backgroundColor: colors.creamMid,
    },
    unsaveBtn: {
        padding: spacing.xs,
    },
    emptyWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        paddingHorizontal: spacing.xxxl,
    },
    emptyTitle: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.lg,
        color: colors.charcoal,
        marginTop: spacing.sm,
    },
    emptyBody: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
        textAlign: "center",
        lineHeight: typography.sizes.md * 1.6,
    },
});
