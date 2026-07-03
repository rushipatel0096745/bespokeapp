// types/community.ts

export type ReactionType = "heart" | "hug" | "relate" | "laugh";

export type PostStatus = "published" | "removed";
export type CommentStatus = "published" | "removed";

// ─── Profile subset used for author display ────────────────
// Only the fields needed in community UI — not the full profile.
export type CommunityAuthor = {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    created_at: string; // member since
};

// ─── Reactions summary attached to a post ─────────────────
export type ReactionSummary = {
    counts: Record<ReactionType, number>;
    total: number;
    // The current user's reaction, if any
    user_reaction: ReactionType | null;
};

// ─── Post ─────────────────────────────────────────────────
export type CommunityPost = {
    id: string;
    author_id: string;
    author: CommunityAuthor;
    body: string;
    image_url: string | null;
    status: PostStatus;
    created_at: string;
    updated_at: string;
    comment_count: number;
    reactions: ReactionSummary;
};

// ─── Comment ──────────────────────────────────────────────
export type CommunityComment = {
    id: string;
    post_id: string;
    author_id: string;
    author: CommunityAuthor;
    parent_comment_id: string | null;
    body: string;
    status: CommentStatus;
    created_at: string;
    updated_at: string;
};

// ─── Report ───────────────────────────────────────────────
export type ReportTargetType = "post" | "comment";

// ─── Feed page (cursor-based pagination) ──────────────────
export type FeedPage = {
    posts: CommunityPost[];
    nextCursor: string | null; // created_at of last post, null = no more pages
};

export type SavedPost = {
    id: string; // community_saved_posts.id
    saved_at: string; // created_at on the save row
    post: {
        id: string;
        author: CommunityAuthor;
        body: string;
        image_url: string | null;
        created_at: string;
    };
};
