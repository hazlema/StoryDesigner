// Story-focused database queries
// Used by both web interface and AI command interface

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

type SupabaseClientType = SupabaseClient<Database>;

// Story operations
export const createStory = async (
  supabase: SupabaseClientType,
  data: {
    author_id: string;
    title: string;
    description?: string;
    slug: string;
    thumbnail?: string;
    tags?: string[];
    is_public?: boolean;
    attributes?: any;
  }
) => {
  const { data: story, error } = await supabase
    .from('stories')
    .insert({
      ...data,
      is_public: data.is_public ?? true
    })
    .select('*')
    .single();

  return { story, error };
};

export const getStories = async (
  supabase: SupabaseClientType,
  options: {
    limit?: number;
    author_id?: string;
    tags?: string[];
    is_public?: boolean;
    is_featured?: boolean;
  } = {}
) => {
  let query = supabase
    .from('stories')
    .select(`
      *,
      users!stories_author_id_fkey (
        username,
        avatar,
        reputation_score
      )
    `)
    .order('created_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.author_id) {
    query = query.eq('author_id', options.author_id);
  }

  if (options.is_public !== undefined) {
    query = query.eq('is_public', options.is_public);
  }

  if (options.is_featured !== undefined) {
    query = query.eq('is_featured', options.is_featured);
  }

  if (options.tags?.length) {
    query = query.contains('tags', options.tags);
  }

  const { data: stories, error } = await query;
  return { stories, error };
};

export const getStoryBySlug = async (
  supabase: SupabaseClientType,
  slug: string
) => {
  const { data: story, error } = await supabase
    .from('stories')
    .select(`
      *,
      users!stories_author_id_fkey (
        username,
        avatar,
        reputation_score
      )
    `)
    .eq('slug', slug)
    .single();

  return { story, error };
};

export const getStoryById = async (
  supabase: SupabaseClientType,
  storyId: string
) => {
  const { data: story, error } = await supabase
    .from('stories')
    .select(`
      *,
      users!stories_author_id_fkey (
        username,
        avatar,
        reputation_score
      )
    `)
    .eq('id', storyId)
    .single();

  return { story, error };
};

export const updateStory = async (
  supabase: SupabaseClientType,
  storyId: string,
  updates: {
    title?: string;
    description?: string;
    thumbnail?: string;
    tags?: string[];
    is_public?: boolean;
    is_featured?: boolean;
    attributes?: any;
  }
) => {
  const { data: story, error } = await supabase
    .from('stories')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', storyId)
    .select('*')
    .single();

  return { story, error };
};

// Story engagement
export const incrementStoryPlayCount = async (
  supabase: SupabaseClientType,
  storyId: string
) => {
  const { data: story, error } = await supabase.rpc('increment_story_play_count', {
    story_id: storyId
  });

  return { story, error };
};

export const likeStory = async (
  supabase: SupabaseClientType,
  storyId: string,
  userId: string
) => {
  // Check if already liked
  const { data: existingLike } = await supabase
    .from('votes')
    .select('id')
    .eq('target_type', 'story')
    .eq('target_id', storyId)
    .eq('user_id', userId)
    .eq('vote_type', 'upvote')
    .single();

  if (existingLike) {
    // Remove like
    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('id', existingLike.id);

    return { liked: false, error };
  } else {
    // Add like
    const { error } = await supabase
      .from('votes')
      .insert({
        user_id: userId,
        target_type: 'story',
        target_id: storyId,
        vote_type: 'upvote'
      });

    return { liked: true, error };
  }
};

// Story search and discovery
export const searchStories = async (
  supabase: SupabaseClientType,
  query: string,
  options: {
    limit?: number;
    tags?: string[];
  } = {}
) => {
  let dbQuery = supabase
    .from('stories')
    .select(`
      *,
      users!stories_author_id_fkey (
        username,
        avatar
      )
    `)
    .eq('is_public', true)
    .or(`title.ilike.%${query}%, description.ilike.%${query}%`)
    .order('play_count', { ascending: false });

  if (options.limit) {
    dbQuery = dbQuery.limit(options.limit);
  }

  if (options.tags?.length) {
    dbQuery = dbQuery.contains('tags', options.tags);
  }

  const { data: stories, error } = await dbQuery;
  return { stories, error };
};

export const getFeaturedStories = async (
  supabase: SupabaseClientType,
  limit: number = 5
) => {
  const { data: stories, error } = await supabase
    .from('stories')
    .select(`
      *,
      users!stories_author_id_fkey (
        username,
        avatar
      )
    `)
    .eq('is_public', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { stories, error };
};

export const getTrendingStories = async (
  supabase: SupabaseClientType,
  limit: number = 10
) => {
  // Get stories with high play counts in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: stories, error } = await supabase
    .from('stories')
    .select(`
      *,
      users!stories_author_id_fkey (
        username,
        avatar
      )
    `)
    .eq('is_public', true)
    .gte('updated_at', sevenDaysAgo.toISOString())
    .order('play_count', { ascending: false })
    .order('like_count', { ascending: false })
    .limit(limit);

  return { stories, error };
};

// Story forking for AI
export const forkStory = async (
  supabase: SupabaseClientType,
  originalStoryId: string,
  forkData: {
    author_id: string;
    title: string;
    description?: string;
    slug: string;
  }
) => {
  // Get original story
  const { story: originalStory, error: fetchError } = await getStoryById(supabase, originalStoryId);
  if (fetchError || !originalStory) {
    return { story: null, error: fetchError || new Error('Story not found') };
  }

  // Create forked story with reference to original
  const { story, error } = await createStory(supabase, {
    ...forkData,
    tags: originalStory.tags || [],
    attributes: {
      ...originalStory.attributes,
      forked_from: originalStoryId,
      fork_created_at: new Date().toISOString()
    }
  });

  if (!error && story) {
    // Increment fork count on original
    await supabase.rpc('increment_story_fork_count', {
      story_id: originalStoryId
    });
  }

  return { story, error };
};