// hooks/useCommunity.ts
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { communityService } from "@/services/community";
import type { CommunityPost, CommunityComment, FeedPage, ReactionType, ReportTargetType } from "@/types/Community";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const communityKeys = {
    feed: () => ["community", "feed"] as const,
    post: (postId: string) => ["community", "post", postId] as const,
    comments: (postId: string) => ["community", "comments", postId] as const,
    author: (authorId: string) => ["community", "author", authorId] as const,
    authorPostCount: (authorId: string) => ["community", "author", authorId, "postCount"] as const,
};

// ─── Feed ─────────────────────────────────────────────────────────────────────

export function useFeed(currentUserId: string | undefined) {
    return useInfiniteQuery({
        queryKey: communityKeys.feed(),
        enabled: !!currentUserId,
        queryFn: ({ pageParam }) => communityService.fetchFeedPage(pageParam as string | null, currentUserId!),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage: FeedPage) => lastPage.nextCursor,
        staleTime: 60_000,
    });
}

// ─── Single post ──────────────────────────────────────────────────────────────

export function usePost(postId: string | undefined, currentUserId: string | undefined) {
    return useQuery({
        queryKey: communityKeys.post(postId ?? ""),
        enabled: !!postId && !!currentUserId,
        queryFn: () => communityService.fetchPost(postId!, currentUserId!),
        staleTime: 30_000,
    });
}

// ─── Create post ──────────────────────────────────────────────────────────────

export function useCreatePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ authorId, body, imageUrl }: { authorId: string; body: string; imageUrl?: string | null }) =>
            communityService.createPost(authorId, body, imageUrl),

        onSuccess: () => {
            // Invalidate the whole feed so the new post appears at the top.
            queryClient.invalidateQueries({ queryKey: communityKeys.feed() });
        },
    });
}

// ─── Delete post ──────────────────────────────────────────────────────────────

export function useDeletePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId: string) => communityService.deletePost(postId),

        onSuccess: (_data, postId) => {
            // Remove from feed cache optimistically
            queryClient.setQueriesData<{ pages: FeedPage[] }>({ queryKey: communityKeys.feed() }, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        posts: page.posts.filter((p) => p.id !== postId),
                    })),
                };
            });
            queryClient.removeQueries({ queryKey: communityKeys.post(postId) });
        },
    });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useComments(postId: string | undefined) {
    return useQuery({
        queryKey: communityKeys.comments(postId ?? ""),
        enabled: !!postId,
        queryFn: () => communityService.fetchComments(postId!),
        staleTime: 30_000,
    });
}

export function useCreateComment(postId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            authorId,
            body,
            parentCommentId,
        }: {
            authorId: string;
            body: string;
            parentCommentId?: string | null;
        }) => communityService.createComment(postId, authorId, body, parentCommentId),

        onSuccess: (newComment) => {
            // Append optimistically to comments cache
            queryClient.setQueryData<CommunityComment[]>(communityKeys.comments(postId), (old) => [
                ...(old ?? []),
                newComment,
            ]);

            // Bump comment_count on the post in feed + post cache
            queryClient.setQueriesData<{ pages: FeedPage[] }>({ queryKey: communityKeys.feed() }, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        posts: page.posts.map((p) =>
                            p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
                        ),
                    })),
                };
            });

            queryClient.setQueryData<CommunityPost>(communityKeys.post(postId), (old) =>
                old ? { ...old, comment_count: old.comment_count + 1 } : old
            );
        },
    });
}

export function useDeleteComment(postId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (commentId: string) => communityService.deleteComment(commentId),

        onSuccess: (_data, commentId) => {
            queryClient.setQueryData<CommunityComment[]>(communityKeys.comments(postId), (old) =>
                (old ?? []).filter((c) => c.id !== commentId)
            );

            // Decrement comment_count in feed + post cache
            queryClient.setQueriesData<{ pages: FeedPage[] }>({ queryKey: communityKeys.feed() }, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        posts: page.posts.map((p) =>
                            p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p
                        ),
                    })),
                };
            });

            queryClient.setQueryData<CommunityPost>(communityKeys.post(postId), (old) =>
                old ? { ...old, comment_count: Math.max(0, old.comment_count - 1) } : old
            );
        },
    });
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export function useToggleReaction(postId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            authorId,
            reactionType,
            currentReaction,
        }: {
            authorId: string;
            reactionType: ReactionType;
            currentReaction: ReactionType | null;
        }) => communityService.toggleReaction(postId, authorId, reactionType, currentReaction),

        onMutate: async ({ reactionType, currentReaction }) => {
            await queryClient.cancelQueries({ queryKey: communityKeys.post(postId) });

            const previousPost = queryClient.getQueryData<CommunityPost>(communityKeys.post(postId));

            const updateReactions = (post: CommunityPost): CommunityPost => {
                const counts = { ...post.reactions.counts };
                const isSameType = currentReaction === reactionType;

                if (currentReaction) counts[currentReaction] = Math.max(0, counts[currentReaction] - 1);
                if (!isSameType) counts[reactionType] = (counts[reactionType] ?? 0) + 1;

                const total = Object.values(counts).reduce((a, b) => a + b, 0);

                return {
                    ...post,
                    reactions: {
                        counts,
                        total,
                        user_reaction: isSameType ? null : reactionType,
                    },
                };
            };

            // Update post cache
            queryClient.setQueryData<CommunityPost>(communityKeys.post(postId), (old) =>
                old ? updateReactions(old) : old
            );

            // Update feed cache
            queryClient.setQueriesData<{ pages: FeedPage[] }>({ queryKey: communityKeys.feed() }, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        posts: page.posts.map((p) => (p.id === postId ? updateReactions(p) : p)),
                    })),
                };
            });

            return { previousPost };
        },

        onError: (_err, _vars, context) => {
            if (context?.previousPost) {
                queryClient.setQueryData(communityKeys.post(postId), context.previousPost);
            }
            queryClient.invalidateQueries({ queryKey: communityKeys.feed() });
        },
    });
}

// ─── Author profile ───────────────────────────────────────────────────────────

export function useAuthorProfile(authorId: string | undefined) {
    return useQuery({
        queryKey: communityKeys.author(authorId ?? ""),
        enabled: !!authorId,
        queryFn: () => communityService.fetchAuthorProfile(authorId!),
        staleTime: 5 * 60_000, // profiles change rarely
    });
}

export function useAuthorPostCount(authorId: string | undefined) {
    return useQuery({
        queryKey: communityKeys.authorPostCount(authorId ?? ""),
        enabled: !!authorId,
        queryFn: () => communityService.fetchAuthorPostCount(authorId!),
        staleTime: 60_000,
    });
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export function useReportTarget() {
    return useMutation({
        mutationFn: ({
            reporterId,
            targetType,
            targetId,
            reason,
        }: {
            reporterId: string;
            targetType: ReportTargetType;
            targetId: string;
            reason?: string;
        }) => communityService.reportTarget(reporterId, targetType, targetId, reason),
    });
}
