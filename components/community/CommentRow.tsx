import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, typography, spacing, radii } from "@/theme/theme";
import type { CommunityComment } from "@/types/Community";
import { AuthorAvatar } from "./AuthorAvatar";

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
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CommentRowProps {
    comment: CommunityComment;
    currentUserId: string | undefined;
    onDelete?: (commentId: string) => void;
    onReport?: (commentId: string) => void;
    onLongPress?: (comment: CommunityComment) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CommentRow({ comment, currentUserId, onDelete, onReport, onLongPress }: CommentRowProps) {
    const isOwn = comment.author_id === currentUserId;
    const authorName = [comment.author.first_name, comment.author.last_name].filter(Boolean).join(" ");

    return (
        <TouchableOpacity
            style={styles.row}
            onLongPress={() => onLongPress?.(comment)}
            activeOpacity={0.75}
            delayLongPress={400}>
            <AuthorAvatar
                firstName={comment.author.first_name}
                lastName={comment.author.last_name}
                avatarUrl={comment.author.avatar_url}
                size='sm'
            />
            <View style={styles.bubble}>
                <View style={styles.bubbleHeader}>
                    <Text style={styles.authorName}>{authorName}</Text>
                    <Text style={styles.timestamp}>{timeAgo(comment.created_at)}</Text>
                </View>
                <Text style={styles.body}>{comment.body}</Text>
            </View>
        </TouchableOpacity>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
    },
    bubble: {
        flex: 1,
        backgroundColor: colors.creamMid,
        borderRadius: radii.lg,
        borderTopLeftRadius: radii.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.xxs,
    },
    bubbleHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    authorName: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xs,
        color: colors.charcoal,
    },
    timestamp: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.xxs,
        color: colors.charcoalLight,
    },
    body: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.base,
        color: colors.charcoalMid,
        lineHeight: typography.sizes.base * 1.5,
    },
});
