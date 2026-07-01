import React, { useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ActionSheetIOS,
    Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { colors, typography, spacing, radii } from "@/theme/theme";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import NavBar from "@/components/layout/NavBar";
import { PostCard } from "@/components/community/PostCard";
import CommentRow from "@/components/community/CommentRow";
import {
    usePost,
    useComments,
    useCreateComment,
    useDeleteComment,
    useDeletePost,
    useToggleReaction,
    useReportTarget,
} from "@/hooks/useCommunity";
import { useAuth } from "@/context/AuthContext";
import type { CommunityComment } from "@/types/Community";

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PostDetailScreen() {
    const { postId } = useLocalSearchParams<{ postId: string }>();
    const { profile } = useAuth();
    const currentUserId = profile?.id;

    const { data: post, isLoading: postLoading } = usePost(postId, currentUserId);
    const { data: comments = [], isLoading: commentsLoading } = useComments(postId);
    const { mutateAsync: createComment, isPending: isSendingComment } = useCreateComment(postId!);
    const { mutateAsync: deleteComment } = useDeleteComment(postId!);
    const { mutateAsync: deletePost } = useDeletePost();
    const { mutate: toggleReaction } = useToggleReaction(postId!);
    const { mutateAsync: reportTarget } = useReportTarget();

    const [commentText, setCommentText] = useState("");
    const inputRef = useRef<TextInput>(null);

    const canSend = commentText.trim().length > 0 && !isSendingComment;

    // ── Send comment ──────────────────────────────────────────────────────────

    async function handleSendComment() {
        if (!canSend || !currentUserId) return;
        const text = commentText.trim();
        setCommentText("");
        await createComment({ authorId: currentUserId, body: text });
    }

    // ── Long press: own post ──────────────────────────────────────────────────

    function handlePostLongPress() {
        if (!post || post.author_id !== currentUserId) return;

        if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions(
                { options: ["Cancel", "Delete post"], destructiveButtonIndex: 1, cancelButtonIndex: 0 },
                (i) => {
                    if (i === 1) confirmDeletePost();
                }
            );
        } else {
            Alert.alert("Delete post", "Are you sure? This can't be undone.", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: confirmDeletePost },
            ]);
        }
    }

    async function confirmDeletePost() {
        if (!postId) return;
        await deletePost(postId);
        router.back();
    }

    // ── Long press: comment ───────────────────────────────────────────────────

    function handleCommentLongPress(comment: CommunityComment) {
        const isOwn = comment.author_id === currentUserId;

        if (isOwn) {
            if (Platform.OS === "ios") {
                ActionSheetIOS.showActionSheetWithOptions(
                    { options: ["Cancel", "Delete comment"], destructiveButtonIndex: 1, cancelButtonIndex: 0 },
                    (i) => {
                        if (i === 1) deleteComment(comment.id);
                    }
                );
            } else {
                Alert.alert("Delete comment", "Are you sure?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => deleteComment(comment.id) },
                ]);
            }
        } else {
            // Report
            if (Platform.OS === "ios") {
                ActionSheetIOS.showActionSheetWithOptions(
                    { options: ["Cancel", "Report comment"], destructiveButtonIndex: 1, cancelButtonIndex: 0 },
                    (i) => {
                        if (i === 1) handleReport("comment", comment.id);
                    }
                );
            } else {
                Alert.alert("Report comment", "Report this comment as inappropriate?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Report", style: "destructive", onPress: () => handleReport("comment", comment.id) },
                ]);
            }
        }
    }

    // ── Report ────────────────────────────────────────────────────────────────

    async function handleReport(targetType: "post" | "comment", targetId: string) {
        if (!currentUserId) return;
        await reportTarget({ reporterId: currentUserId, targetType, targetId });
        Alert.alert("Reported", "Thank you — we'll review this shortly.");
    }

    // ── Header right: report post (for others' posts) ─────────────────────────

    const isOwnPost = post?.author_id === currentUserId;
    const HeaderRight = !isOwnPost ? (
        <TouchableOpacity
            onPress={() => post && handleReport("post", post.id)}
            style={styles.reportBtn}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Text style={styles.reportBtnText}>Report</Text>
        </TouchableOpacity>
    ) : undefined;

    // ── Render ────────────────────────────────────────────────────────────────

    if (postLoading) {
        return (
            <ScreenWrapper scrollable={false} header={<NavBar variant='back' title='' />}>
                <View style={styles.centered}>
                    <ActivityIndicator size='large' color={colors.gold} />
                </View>
            </ScreenWrapper>
        );
    }

    if (!post) {
        return (
            <ScreenWrapper scrollable={false} header={<NavBar variant='back' title='' />}>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Post not found.</Text>
                </View>
            </ScreenWrapper>
        );
    }

    const ListHeader = (
        <View>
            {/* Full post */}
            <PostCard
                post={post}
                currentUserId={currentUserId}
                onAuthorPress={() => router.push(`/community/profile/${post.author_id}`)}
                onLongPress={isOwnPost ? handlePostLongPress : undefined}
                showFullBody
                onReact={(type) => {
                    if (!currentUserId) return;
                    toggleReaction({
                        authorId: currentUserId,
                        reactionType: type,
                        currentReaction: post.reactions.user_reaction,
                    });
                }}
            />

            <View style={styles.commentsDivider}>
                <Text style={styles.commentsSectionLabel}>
                    {comments.length > 0
                        ? `${comments.length} comment${comments.length !== 1 ? "s" : ""}`
                        : "No comments yet"}
                </Text>
            </View>
        </View>
    );

    return (
        <ScreenWrapper scrollable={false} header={<NavBar variant='back' title='Post' rightElement={HeaderRight} />}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={0}>
                <FlatList
                    data={comments}
                    keyExtractor={(c) => c.id}
                    ListHeaderComponent={ListHeader}
                    renderItem={({ item }) => (
                        <CommentRow comment={item} currentUserId={currentUserId} onLongPress={handleCommentLongPress} />
                    )}
                    ListEmptyComponent={
                        commentsLoading ? (
                            <View style={styles.commentLoader}>
                                <ActivityIndicator size='small' color={colors.gold} />
                            </View>
                        ) : null
                    }
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />

                {/* Sticky comment input */}
                <View style={styles.inputBar}>
                    <TextInput
                        ref={inputRef}
                        style={styles.commentInput}
                        placeholder='Add a comment…'
                        placeholderTextColor={colors.charcoalLight}
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                        maxLength={500}
                        returnKeyType='send'
                        onSubmitEditing={handleSendComment}
                        blurOnSubmit={false}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
                        onPress={handleSendComment}
                        disabled={!canSend}
                        activeOpacity={0.7}>
                        {isSendingComment ? (
                            <ActivityIndicator size='small' color={colors.white} />
                        ) : (
                            <Text style={styles.sendBtnText}>↑</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    flex: { flex: 1 },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    errorText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoalLight,
    },
    commentsDivider: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        backgroundColor: colors.creamMid,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    commentsSectionLabel: {
        fontFamily: typography.fonts.sansMedium,
        fontSize: typography.sizes.xs,
        color: colors.charcoalLight,
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    listContent: {
        paddingBottom: spacing.xl,
    },
    commentLoader: {
        paddingVertical: spacing.xl,
        alignItems: "center",
    },
    inputBar: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        backgroundColor: colors.white,
    },
    commentInput: {
        flex: 1,
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.md,
        color: colors.charcoal,
        backgroundColor: colors.creamMid,
        borderRadius: radii.xxl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        maxHeight: 100,
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: radii.full,
        backgroundColor: colors.gold,
        alignItems: "center",
        justifyContent: "center",
    },
    sendBtnDisabled: {
        backgroundColor: colors.border,
    },
    sendBtnText: {
        fontFamily: typography.fonts.sansBold,
        fontSize: typography.sizes.lg,
        color: colors.charcoal,
        lineHeight: typography.sizes.lg + 2,
    },
    reportBtn: {
        paddingHorizontal: spacing.xs,
    },
    reportBtnText: {
        fontFamily: typography.fonts.sans,
        fontSize: typography.sizes.sm,
        color: colors.error,
    },
});
