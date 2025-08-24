// Simplified database queries for AI Story Interface
// CommonJS version of the centralized queries

// User operations - simplified for AI interface
const { v4: uuidv4 } = require('uuid');
const ensureUserProfile = async (supabase, authUser) => {
  if (!authUser) return { user: null, error: new Error('No auth user provided') };

  // For AI interface, we'll create a temporary auth user first, then the profile
  try {
    // First, try to create the auth user (this might fail if user exists)
    const desiredPassword = authUser.password || authUser.email || `${uuidv4()}Aa1!`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: authUser.email,
      password: desiredPassword,
      email_confirm: true,
      user_metadata: {
        username: authUser.user_metadata?.username || 'AI User'
      }
    });

    // Determine auth user id: prefer newly created; else provided; else find by email
    let userId = authData?.user?.id || authUser.id || null;
    if (!userId && authUser.email) {
      try {
        const { data: list } = await supabase.auth.admin.listUsers();
        const found = list?.users?.find((u) => u.email?.toLowerCase() === authUser.email.toLowerCase());
        if (found) userId = found.id;
      } catch (_e) {
        // ignore and handle below
      }
    }

    if (!userId) {
      return { user: null, error: new Error('Unable to resolve auth user id') };
    }

    // Check if profile exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingUser && !fetchError) {
      return { user: existingUser, error: null };
    }

    // Create profile if it doesn't exist
    // Generate a unique username by combining base name with timestamp
    const baseName = authUser.user_metadata?.username || 
      authUser.user_metadata?.user_name ||
      authUser.user_metadata?.full_name ||
      authUser.email?.split('@')[0] || 
      'aiuser';
    
    const timestamp = Date.now().toString(36);
    const username = `${baseName}_${timestamp}`.toLowerCase();

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        username: username,
        email: authUser.email || '',
        avatar: authUser.user_metadata?.avatar_url || null
      })
      .select('*')
      .single();

    return { user: newUser, error };
  } catch (error) {
    return { user: null, error };
  }
};

// Community operations
const createPost = async (supabase, data) => {
  const { data: post, error } = await supabase
    .from('posts')
    .insert(data)
    .select('*')
    .single();

  return { post, error };
};

const getPosts = async (supabase, options = {}) => {
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

const createReply = async (supabase, data) => {
  const { data: reply, error } = await supabase
    .from('replies')
    .insert(data)
    .select('*')
    .single();

  return { reply, error };
};

const voteOnPost = async (supabase, data) => {
  // First, try to upsert the vote
  const { data: vote, error } = await supabase
    .from('votes')
    .upsert({
      user_id: data.userId,
      target_type: 'post', 
      target_id: data.postId,
      vote_type: data.voteType,
      reason: data.reason || null
    })
    .select('*')
    .single();

  return { vote, error };
};

const searchPosts = async (supabase, query, options = {}) => {
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

const deletePost = async (supabase, postId, authorId) => {
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

// Story operations
const createStory = async (supabase, data) => {
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

const getStories = async (supabase, options = {}) => {
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

const getStoryBySlug = async (supabase, slug) => {
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

const updateStory = async (supabase, storyId, updates) => {
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

const searchStories = async (supabase, query, options = {}) => {
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

const forkStory = async (supabase, originalStoryId, forkData) => {
  // Get original story
  const { data: originalStory, error: fetchError } = await supabase
    .from('stories')
    .select('*')
    .eq('id', originalStoryId)
    .single();
    
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

module.exports = {
  // User operations
  ensureUserProfile,
  
  // Community operations
  createPost,
  getPosts,
  createReply,
  voteOnPost,
  searchPosts,
  deletePost,
  
  // Story operations
  createStory,
  getStories,
  getStoryBySlug,
  updateStory,
  searchStories,
  forkStory
};