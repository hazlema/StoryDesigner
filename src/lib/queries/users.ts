// User-focused database queries
// Used by both web interface and AI command interface

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

type SupabaseClientType = SupabaseClient<Database>;

// User profile operations
export const getUserProfile = async (
  supabase: SupabaseClientType,
  userId: string
) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  return { user, error };
};

export const getUserByUsername = async (
  supabase: SupabaseClientType,
  username: string
) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  return { user, error };
};

export const updateUserProfile = async (
  supabase: SupabaseClientType,
  userId: string,
  updates: {
    username?: string;
    bio?: string;
    location?: string;
    website?: string;
    avatar?: string;
  }
) => {
  const { data: user, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select('*')
    .single();

  return { user, error };
};

export const ensureUserProfile = async (
  supabase: SupabaseClientType,
  authUser: any
) => {
  if (!authUser) return { user: null, error: new Error('No auth user provided') };

  // Check if profile exists
  const { user: existingUser } = await getUserProfile(supabase, authUser.id);
  if (existingUser) {
    return { user: existingUser, error: null };
  }

  // Create profile if it doesn't exist
  const username = authUser.user_metadata?.username || 
    authUser.user_metadata?.user_name ||
    authUser.user_metadata?.full_name ||
    authUser.email?.split('@')[0] || 
    `user_${Math.random().toString(36).substr(2, 9)}`;

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      id: authUser.id,
      username: username.toLowerCase(),
      email: authUser.email || '',
      avatar: authUser.user_metadata?.avatar_url || null
    })
    .select('*')
    .single();

  return { user: newUser, error };
};

// User stats and activity
export const getUserStats = async (
  supabase: SupabaseClientType,
  userId: string
) => {
  const [postsCount, repliesCount, storiesCount, reputation] = await Promise.all([
    supabase
      .from('posts')
      .select('id', { count: 'exact' })
      .eq('author_id', userId)
      .is('deleted_at', null),
    
    supabase
      .from('replies')
      .select('id', { count: 'exact' })
      .eq('author_id', userId)
      .is('deleted_at', null),
    
    supabase
      .from('stories')
      .select('id', { count: 'exact' })
      .eq('author_id', userId),
    
    supabase
      .from('users')
      .select('reputation_score')
      .eq('id', userId)
      .single()
  ]);

  return {
    postsCount: postsCount.count || 0,
    repliesCount: repliesCount.count || 0,
    storiesCount: storiesCount.count || 0,
    reputation: reputation.data?.reputation_score || 0,
    error: postsCount.error || repliesCount.error || storiesCount.error || reputation.error
  };
};

// User search and discovery
export const searchUsers = async (
  supabase: SupabaseClientType,
  query: string,
  limit: number = 10
) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, avatar, bio, reputation_score')
    .or(`username.ilike.%${query}%, bio.ilike.%${query}%`)
    .order('reputation_score', { ascending: false })
    .limit(limit);

  return { users, error };
};

// User following system
export const followUser = async (
  supabase: SupabaseClientType,
  followerId: string,
  followingId: string
) => {
  const { data: follow, error } = await supabase
    .from('follows')
    .insert({
      follower_id: followerId,
      following_id: followingId
    })
    .select('*')
    .single();

  return { follow, error };
};

export const unfollowUser = async (
  supabase: SupabaseClientType,
  followerId: string,
  followingId: string
) => {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  return { error };
};

export const getFollowing = async (
  supabase: SupabaseClientType,
  userId: string
) => {
  const { data: following, error } = await supabase
    .from('follows')
    .select(`
      following_id,
      users!follows_following_id_fkey (
        id, username, avatar, bio, reputation_score
      )
    `)
    .eq('follower_id', userId);

  return { following, error };
};

export const getFollowers = async (
  supabase: SupabaseClientType,
  userId: string
) => {
  const { data: followers, error } = await supabase
    .from('follows')
    .select(`
      follower_id,
      users!follows_follower_id_fkey (
        id, username, avatar, bio, reputation_score
      )
    `)
    .eq('following_id', userId);

  return { followers, error };
};

// Credit system
export const updateUserCredits = async (
  supabase: SupabaseClientType,
  userId: string,
  amount: number,
  reason?: string
) => {
  // Get current credits
  const { data: currentUser, error: fetchError } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  if (fetchError) return { user: null, error: fetchError };

  const newCredits = Math.max(0, (currentUser.credits || 0) + amount);

  const { data: user, error } = await supabase
    .from('users')
    .update({ 
      credits: newCredits,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select('*')
    .single();

  // TODO: Log credit transaction with reason
  // await logCreditTransaction(supabase, userId, amount, reason);

  return { user, error };
};