// Community-focused database queries
// Used by both web interface and AI command interface

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

type SupabaseClientType = SupabaseClient<Database>;

// Post operations
export const createPost = async (
  supabase: SupabaseClientType,
  data: {
    author_id: string;
    title?: string;
    text: string;
    category?: string;
    tags?: string[];
  }
) => {
  const { data: post, error } = await supabase
    .from('posts')
    .insert(data)
    .select('*')
    .single();

  return { post, error };
};

export const getPosts = async (
  supabase: SupabaseClientType,
  options: {
    limit?: number;
    category?: string;
    author_id?: string;
    tags?: string[];
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
      )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.category) {
    query = query.eq('category', options.category);
  }

  if (options.author_id) {
    query = query.eq('author_id', options.author_id);
  }

  if (options.tags?.length) {
    query = query.contains('tags', options.tags);
  }

  const { data: posts, error } = await query;
  return { posts, error };
};

export const getPostById = async (
  supabase: SupabaseClientType,
  postId: string
) => {
  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      users!posts_author_id_fkey (
        username,
        avatar,
        reputation_score
      )
    `)
    .eq('id', postId)
    .is('deleted_at', null)
    .single();

  return { post, error };
};

// Reply operations
export const createReply = async (
  supabase: SupabaseClientType,
  data: {
    parent_id: string;
    author_id: string;
    text: string;
  }
) => {
  const { data: reply, error } = await supabase
    .from('replies')
    .insert(data)
    .select('*')
    .single();

  return { reply, error };
};

export const getRepliesForPost = async (
  supabase: SupabaseClientType,
  postId: string
) => {
  const { data: replies, error } = await supabase
    .from('replies')
    .select(`
      *,
      users!replies_author_id_fkey (
        username,
        avatar,
        reputation_score
      )
    `)
    .eq('parent_id', postId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  return { replies, error };
};

// Voting operations
export const voteOnPost = async (
  supabase: SupabaseClientType,
  data: {
    user_id: string;
    target_id: string;
    vote_type: 'upvote' | 'downvote';
    reason?: string;
  }
) => {
  // First, try to upsert the vote
  const { data: vote, error } = await supabase
    .from('votes')
    .upsert({
      user_id: data.user_id,
      target_type: 'post',
      target_id: data.target_id,
      vote_type: data.vote_type,
      reason: data.reason || null
    })
    .select('*')
    .single();

  if (error) return { vote: null, error };

  // Update post vote counts
  const { error: updateError } = await supabase.rpc('update_post_votes', {
    post_id: data.target_id
  });

  return { vote, error: updateError };
};

// User activity
export const getUserActivity = async (
  supabase: SupabaseClientType,
  userId: string
) => {
  const [postsResult, repliesResult] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, text, created_at, upvotes, downvotes')
      .eq('author_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10),
    
    supabase
      .from('replies')
      .select('id, text, created_at, parent_id')
      .eq('author_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10)
  ]);

  return {
    posts: postsResult.data || [],
    replies: repliesResult.data || [],
    error: postsResult.error || repliesResult.error
  };
};