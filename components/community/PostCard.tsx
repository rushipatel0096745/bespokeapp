import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { colors, typography, spacing, radii, shadows } from "@/theme/theme";
import { AuthorAvatar } from "./AuthorAvatar";
import { ReactionBar } from "./ReactionBar";
import type { CommunityPost, ReactionType } from "@/types/Community";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
    });
}

const BODY_PREVIEW_LINES = 4;

// ─── Props ────────────────────────────────────────────────────────────────────

interface PostCardProps {
    post: CommunityPost;
    currentUserId: string | undefined;
    onPress?: () => void;
    onAuthorPress?: () => void;
    onReact?: (type: ReactionType) => void;
    onLongPress?: () => void;
    // Pass true in post detail screen to show full body without truncation
    showFullBody?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PostCard({
    post,
    currentUserId,
    onPress,
    onAuthorPress,
    onReact,
    onLongPress,
    showFullBody = false,
}: PostCardProps) {
    const authorName = [post.author.first_name, post.author.last_name].filter(Boolean).join(" ");

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={onPress ? 0.7 : 1}
            delayLongPress={400}
            disabled={!onPress && !onLongPress}>
            {/* ── Header: avatar + name + timestamp ── */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={onAuthorPress}
                    activeOpacity={0.7}
                    disabled={!onAuthorPress}
                    style={styles.authorRow}>
                    <AuthorAvatar
                        firstName={post.author.first_name}
                        lastName={post.author.last_name}
                        avatarUrl={post.author.avatar_url}
                        size='sm'
                    />
                    <View style={styles.authorMeta}>
                        <Text style={styles.authorName}>{authorName}</Text>
                        <Text style={styles.timestamp}>{timeAgo(post.created_at)}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* ── Body ── */}
            <Text style={styles.body} numberOfLines={showFullBody ? undefined : BODY_PREVIEW_LINES}>
                {post.body}
            </Text>

            {/* ── Optional image ── */}
            {post.image_url && <Image source={{ uri: post.image_url }} style={styles.image} resizeMode='cover' />}

            {/* ── Footer: reactions + comment count ── */}
            <View style={styles.footer}>
                <ReactionBar reactions={post.reactions} onReact={(type) => onReact?.(type)} disabled={!onReact} />
                <TouchableOpacity style={styles.commentCount} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
                    <Text style={styles.commentCountIcon}>💬</Text>
                    <Text style={styles.commentCountText}>{post.comment_count > 0 ? post.comment_count : ""}</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        gap: spacing.md,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    authorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        flex: 1,
    },
    authorMeta: {
        gap: spacing.xxs,
    },
    authorName: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.sm,
        color: colors.charcoal,
    },
    timestamp: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xxs,
        color: colors.charcoalLight,
    },
    body: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalMid,
        lineHeight: typography.sizes.md * 1.6,
    },
    image: {
        width: "100%",
        height: 200,
        borderRadius: radii.md,
        backgroundColor: colors.creamMid,
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: spacing.xxs,
    },
    commentCount: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xxs,
        padding: spacing.xs,
    },
    commentCountIcon: {
        fontSize: typography.sizes.base,
    },
    commentCountText: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
        minWidth: 16,
    },
});
