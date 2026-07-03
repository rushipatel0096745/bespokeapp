// services/communityService.ts
import { supabase } from "@/lib/supabase";
import type {
    CommunityPost,
    CommunityComment,
    CommunityAuthor,
    ReactionType,
    ReactionSummary,
    FeedPage,
    ReportTargetType,
    SavedPost,
} from "@/types/Community";

const FEED_PAGE_SIZE = 15;

// ─── Internal helpers ──────────────────────────────────────────────────────────

// Selects the profile fields we need for author display.
const AUTHOR_SELECT = `
  author:profiles!author_id (
    id,
    first_name,
    last_name,
    avatar_url,
    created_at
  )
`;

// Assembles a ReactionSummary from raw reaction rows + current user id.
function buildReactionSummary(
    reactions: { reaction_type: ReactionType; author_id: string }[],
    currentUserId: string
): ReactionSummary {
    const counts: Record<ReactionType, number> = {
        heart: 0,
        hug: 0,
        relate: 0,
        laugh: 0,
    };

    let userReaction: ReactionType | null = null;

    for (const r of reactions) {
        counts[r.reaction_type] = (counts[r.reaction_type] ?? 0) + 1;
        if (r.author_id === currentUserId) {
            userReaction = r.reaction_type;
        }
    }

    return {
        counts,
        total: reactions.length,
        user_reaction: userReaction,
    };
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

async function fetchFeedPage(cursor: string | null, currentUserId: string): Promise<FeedPage> {
    let query = supabase
        .from("community_posts")
        .select(
            `
            id, author_id, body, image_url, status, created_at, updated_at,
            ${AUTHOR_SELECT},
            community_reactions ( reaction_type, author_id ),
            community_comments ( id )
        `
        )
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(FEED_PAGE_SIZE);

    // Cursor-based pagination: fetch posts older than the last seen created_at.
    if (cursor) {
        query = query.lt("created_at", cursor);
    }

    const { data, error } = await query;
    if (error) throw error;

    const posts: CommunityPost[] = (data ?? []).map((row: any) => ({
        id: row.id,
        author_id: row.author_id,
        author: row.author as CommunityAuthor,
        body: row.body,
        image_url: row.image_url,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        comment_count: (row.community_comments ?? []).length,
        reactions: buildReactionSummary(row.community_reactions ?? [], currentUserId),
    }));

    const nextCursor = posts.length === FEED_PAGE_SIZE ? posts[posts.length - 1].created_at : null;

    return { posts, nextCursor };
}

// ─── Single post ──────────────────────────────────────────────────────────────

async function fetchPost(postId: string, currentUserId: string): Promise<CommunityPost> {
    const { data, error } = await supabase
        .from("community_posts")
        .select(
            `
            id, author_id, body, image_url, status, created_at, updated_at,
            ${AUTHOR_SELECT},
            community_reactions ( reaction_type, author_id ),
            community_comments ( id )
        `
        )
        .eq("id", postId)
        .single();

    if (error) throw error;

    return {
        id: data.id,
        author_id: data.author_id,
        author: data.author as unknown as CommunityAuthor,
        body: data.body,
        image_url: data.image_url,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        comment_count: (data.community_comments ?? []).length,
        reactions: buildReactionSummary(data.community_reactions ?? [], currentUserId),
    };
}

// ─── Create post ──────────────────────────────────────────────────────────────

async function createPost(authorId: string, body: string, imageUrl?: string | null): Promise<string> {
    const { data, error } = await supabase
        .from("community_posts")
        .insert({ author_id: authorId, body, image_url: imageUrl ?? null })
        .select("id")
        .single();

    if (error) throw error;
    return data.id;
}

// ─── Soft delete post ─────────────────────────────────────────────────────────

async function deletePost(postId: string): Promise<void> {
    const { error } = await supabase.from("community_posts").update({ status: "removed" }).eq("id", postId);

    if (error) throw error;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

async function fetchComments(postId: string): Promise<CommunityComment[]> {
    const { data, error } = await supabase
        .from("community_comments")
        .select(
            `
            id, post_id, author_id, parent_comment_id, body, status, created_at, updated_at,
            ${AUTHOR_SELECT}
        `
        )
        .eq("post_id", postId)
        .eq("status", "published")
        .order("created_at", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
        id: row.id,
        post_id: row.post_id,
        author_id: row.author_id,
        author: row.author as CommunityAuthor,
        parent_comment_id: row.parent_comment_id,
        body: row.body,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }));
}

async function createComment(
    postId: string,
    authorId: string,
    body: string,
    parentCommentId?: string | null
): Promise<CommunityComment> {
    const { data, error } = await supabase
        .from("community_comments")
        .insert({
            post_id: postId,
            author_id: authorId,
            body,
            parent_comment_id: parentCommentId ?? null,
        })
        .select(
            `
            id, post_id, author_id, parent_comment_id, body, status, created_at, updated_at,
            ${AUTHOR_SELECT}
        `
        )
        .single();

    if (error) throw error;

    return {
        id: data.id,
        post_id: data.post_id,
        author_id: data.author_id,
        author: data.author as unknown as CommunityAuthor,
        parent_comment_id: data.parent_comment_id,
        body: data.body,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
    };
}

async function deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase.from("community_comments").update({ status: "removed" }).eq("id", commentId);

    if (error) throw error;
}

// ─── Reactions ────────────────────────────────────────────────────────────────
// Toggle logic:
//   - No existing reaction → insert
//   - Same reaction type → delete (un-react)
//   - Different reaction type → upsert (switch type)

async function toggleReaction(
    postId: string,
    authorId: string,
    reactionType: ReactionType,
    currentReaction: ReactionType | null
): Promise<void> {
    if (currentReaction === reactionType) {
        // Tapping the same type again removes the reaction
        const { error } = await supabase
            .from("community_reactions")
            .delete()
            .eq("post_id", postId)
            .eq("author_id", authorId);

        if (error) throw error;
        return;
    }

    // Insert or switch type — upsert on the unique (post_id, author_id) constraint
    const { error } = await supabase
        .from("community_reactions")
        .upsert(
            { post_id: postId, author_id: authorId, reaction_type: reactionType },
            { onConflict: "post_id,author_id" }
        );

    if (error) throw error;
}

// ─── Author profile ───────────────────────────────────────────────────────────

async function fetchAuthorProfile(authorId: string): Promise<CommunityAuthor> {
    const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, created_at")
        .eq("id", authorId)
        .single();

    if (error) throw error;
    return data as CommunityAuthor;
}

async function fetchAuthorPostCount(authorId: string): Promise<number> {
    const { count, error } = await supabase
        .from("community_posts")
        .select("id", { count: "exact", head: true })
        .eq("author_id", authorId)
        .eq("status", "published");

    if (error) throw error;
    return count ?? 0;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

async function reportTarget(
    reporterId: string,
    targetType: ReportTargetType,
    targetId: string,
    reason?: string
): Promise<void> {
    const { error } = await supabase
        .from("community_reports")
        .insert({ reporter_id: reporterId, target_type: targetType, target_id: targetId, reason: reason ?? null });

    // Unique constraint violation = already reported — treat as success silently.
    if (error && error.code !== "23505") throw error;
}

// ── Add these functions to communityService.ts ────────────────────────────────

// ─── fetchSavedPosts ──────────────────────────────────────────────────────────
// Returns saved post rows newest-first, with post + author joined.

async function fetchSavedPosts(userId: string): Promise<SavedPost[]> {
    const { data, error } = await supabase
        .from("community_saved_posts")
        .select(
            `
            id,
            created_at,
            post:community_posts (
                id,
                body,
                image_url,
                created_at,
                author:profiles!author_id (
                    id,
                    first_name,
                    last_name,
                    avatar_url,
                    created_at
                )
            )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
        id: row.id,
        saved_at: row.created_at,
        post: {
            id: row.post.id,
            body: row.post.body,
            image_url: row.post.image_url,
            created_at: row.post.created_at,
            author: row.post.author as CommunityAuthor,
        },
    }));
}

// ─── fetchSavedPostIds ────────────────────────────────────────────────────────
// Lightweight — just the post IDs the user has saved.
// Used to hydrate bookmark state across the feed without fetching full posts.

async function fetchSavedPostIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase.from("community_saved_posts").select("post_id").eq("user_id", userId);

    if (error) throw error;
    return (data ?? []).map((row) => row.post_id);
}

// ─── savePost ─────────────────────────────────────────────────────────────────

async function savePost(userId: string, postId: string): Promise<void> {
    const { error } = await supabase.from("community_saved_posts").insert({ user_id: userId, post_id: postId });

    // 23505 = unique violation — already saved, treat as success
    if (error && error.code !== "23505") throw error;
}

// ─── unsavePost ───────────────────────────────────────────────────────────────

async function unsavePost(userId: string, postId: string): Promise<void> {
    const { error } = await supabase.from("community_saved_posts").delete().eq("user_id", userId).eq("post_id", postId);

    if (error) throw error;
}

// ── Add to the communityService export object:
// fetchSavedPosts,
// fetchSavedPostIds,
// savePost,
// unsavePost,

// ─── Export ───────────────────────────────────────────────────────────────────

export const communityService = {
    fetchFeedPage,
    fetchPost,
    createPost,
    deletePost,
    fetchComments,
    createComment,
    deleteComment,
    toggleReaction,
    fetchAuthorProfile,
    fetchAuthorPostCount,
    reportTarget,
    fetchSavedPosts,
    fetchSavedPostIds,
    savePost,
    unsavePost,
};
