// Post-focused database queries
// Used by both web interface and AI command interface

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

type SupabaseClientType = SupabaseClient<Database>;

// Extended post operations beyond community.ts
export const getPostsByCategory = async (
  supabase: SupabaseClientType,
  category: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
) => {
  let query = supabase
    .from('posts')
    .select(`
      *,
      users!posts_author_id_fkey (
        username,
        avatar,
        reputation_score
      ),
      replies(count)
    `)
    .eq('category', category)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data: posts, error } = await query;
  return { posts, error };
};

export const getTrendingPosts = async (
  supabase: SupabaseClientType,
  limit: number = 10
) => {
  // Get posts with high engagement in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      users!posts_author_id_fkey (
        username,
        avatar,
        reputation_score
      )
    `)
    .is('deleted_at', null)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('upvotes', { ascending: false })
    .order('views', { ascending: false })
    .limit(limit);

  return { posts, error };
};

export const getHotPosts = async (
  supabase: SupabaseClientType,
  limit: number = 10
) => {
  // Get posts with recent activity (high upvotes + recent replies)
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      users!posts_author_id_fkey (
        username,
        avatar,
        reputation_score
      )
    `)
    .is('deleted_at', null)
    .gt('upvotes', 5)
    .order('updated_at', { ascending: false })
    .limit(limit);

  return { posts, error };
};

export const searchPosts = async (
  supabase: SupabaseClientType,
  query: string,
  options: {
    limit?: number;
    category?: string;
    tags?: string[];
  } = {}
) => {
  let dbQuery = supabase
    .from('posts')
    .select(`
      *,
      users!posts_author_id_fkey (
        username,
        avatar,
        reputation_score
      )
    `)
    .is('deleted_at', null)
    .or(`title.ilike.%${query}%, text.ilike.%${query}%`)
    .order('upvotes', { ascending: false });

  if (options.limit) {
    dbQuery = dbQuery.limit(options.limit);
  }

  if (options.category) {
    dbQuery = dbQuery.eq('category', options.category);
  }

  if (options.tags?.length) {
    dbQuery = dbQuery.contains('tags', options.tags);
  }

  const { data: posts, error } = await dbQuery;
  return { posts, error };
};

export const incrementPostViews = async (
  supabase: SupabaseClientType,
  postId: string
) => {
  const { data: post, error } = await supabase.rpc('increment_post_views', {
    post_id: postId
  });

  return { post, error };
};

export const pinPost = async (
  supabase: SupabaseClientType,
  postId: string,
  isPinned: boolean = true
) => {
  const { data: post, error } = await supabase
    .from('posts')
    .update({ 
      is_pinned: isPinned,
      updated_at: new Date().toISOString()
    })
    .eq('id', postId)
    .select('*')
    .single();

  return { post, error };
};

export const lockPost = async (
  supabase: SupabaseClientType,
  postId: string,
  isLocked: boolean = true
) => {
  const { data: post, error } = await supabase
    .from('posts')
    .update({ 
      is_locked: isLocked,
      updated_at: new Date().toISOString()
    })
    .eq('id', postId)
    .select('*')
    .single();

  return { post, error };
};

export const deletePost = async (
  supabase: SupabaseClientType,
  postId: string,
  authorId: string
) => {
  // Soft delete - mark as deleted instead of removing
  const { data: post, error } = await supabase
    .from('posts')
    .update({ 
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', postId)
    .eq('author_id', authorId) // Ensure user can only delete their own posts
    .select('*')
    .single();

  return { post, error };
};

// Post statistics
export const getPostStats = async (
  supabase: SupabaseClientType,
  postId: string
) => {
  const [replyCount, voteStats] = await Promise.all([
    supabase
      .from('replies')
      .select('id', { count: 'exact' })
      .eq('parent_id', postId)
      .is('deleted_at', null),
    
    supabase
      .from('votes')
      .select('vote_type')
      .eq('target_type', 'post')
      .eq('target_id', postId)
  ]);

  const upvotes = voteStats.data?.filter(v => v.vote_type === 'upvote').length || 0;
  const downvotes = voteStats.data?.filter(v => v.vote_type === 'downvote').length || 0;

  return {
    replyCount: replyCount.count || 0,
    upvotes,
    downvotes,
    error: replyCount.error || voteStats.error
  };
};

// Bulk operations for AI
export const getPostsForAI = async (
  supabase: SupabaseClientType,
  options: {
    limit?: number;
    include_content?: boolean;
    category?: string;
    min_upvotes?: number;
  } = {}
) => {
  const selectFields = options.include_content 
    ? `id, title, text, category, tags, upvotes, created_at, users!posts_author_id_fkey (username)`
    : `id, title, category, tags, upvotes, created_at, users!posts_author_id_fkey (username)`;

  let query = supabase
    .from('posts')
    .select(selectFields)
    .is('deleted_at', null)
    .order('upvotes', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.category) {
    query = query.eq('category', options.category);
  }

  if (options.min_upvotes) {
    query = query.gte('upvotes', options.min_upvotes);
  }

  const { data: posts, error } = await query;
  return { posts, error };
};