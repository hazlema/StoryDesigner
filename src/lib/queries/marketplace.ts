// Marketplace-focused database queries
// Used by both web interface and AI command interface

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

type SupabaseClientType = SupabaseClient<Database>;

// Marketplace item operations
export const createMarketplaceItem = async (
  supabase: SupabaseClientType,
  data: {
    author_id: string;
    name: string;
    description?: string;
    thumbnail?: string;
    url?: string;
    category?: string;
    price?: number;
    tags?: string[];
    attributes?: any;
  }
) => {
  const { data: item, error } = await supabase
    .from('marketplace')
    .insert({
      ...data,
      category: data.category || 'template',
      price: data.price || 0
    })
    .select('*')
    .single();

  return { item, error };
};

export const getMarketplaceItems = async (
  supabase: SupabaseClientType,
  options: {
    limit?: number;
    category?: string;
    author_id?: string;
    tags?: string[];
    is_featured?: boolean;
    is_approved?: boolean;
    max_price?: number;
    min_price?: number;
  } = {}
) => {
  let query = supabase
    .from('marketplace')
    .select(`
      *,
      users!marketplace_author_id_fkey (
        username,
        avatar,
        reputation_score
      )
    `)
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

  if (options.is_featured !== undefined) {
    query = query.eq('is_featured', options.is_featured);
  }

  if (options.is_approved !== undefined) {
    query = query.eq('is_approved', options.is_approved);
  }

  if (options.max_price !== undefined) {
    query = query.lte('price', options.max_price);
  }

  if (options.min_price !== undefined) {
    query = query.gte('price', options.min_price);
  }

  if (options.tags?.length) {
    query = query.contains('tags', options.tags);
  }

  const { data: items, error } = await query;
  return { items, error };
};

export const getMarketplaceItemById = async (
  supabase: SupabaseClientType,
  itemId: string
) => {
  const { data: item, error } = await supabase
    .from('marketplace')
    .select(`
      *,
      users!marketplace_author_id_fkey (
        username,
        avatar,
        reputation_score
      )
    `)
    .eq('id', itemId)
    .single();

  return { item, error };
};

export const updateMarketplaceItem = async (
  supabase: SupabaseClientType,
  itemId: string,
  updates: {
    name?: string;
    description?: string;
    thumbnail?: string;
    url?: string;
    price?: number;
    tags?: string[];
    is_featured?: boolean;
    is_approved?: boolean;
    attributes?: any;
  }
) => {
  const { data: item, error } = await supabase
    .from('marketplace')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId)
    .select('*')
    .single();

  return { item, error };
};

// Marketplace engagement
export const incrementDownloadCount = async (
  supabase: SupabaseClientType,
  itemId: string
) => {
  const { data: item, error } = await supabase.rpc('increment_marketplace_downloads', {
    item_id: itemId
  });

  return { item, error };
};

export const rateMarketplaceItem = async (
  supabase: SupabaseClientType,
  itemId: string,
  userId: string,
  rating: number
) => {
  // Validate rating (1-5)
  if (rating < 1 || rating > 5) {
    return { error: new Error('Rating must be between 1 and 5') };
  }

  // Check if user already rated this item
  const { data: existingRating } = await supabase
    .from('votes')
    .select('id')
    .eq('target_type', 'marketplace')
    .eq('target_id', itemId)
    .eq('user_id', userId)
    .single();

  if (existingRating) {
    // Update existing rating
    const { error } = await supabase
      .from('votes')
      .update({ 
        vote_type: rating.toString(),
        created_at: new Date().toISOString()
      })
      .eq('id', existingRating.id);

    return { error };
  } else {
    // Create new rating
    const { error } = await supabase
      .from('votes')
      .insert({
        user_id: userId,
        target_type: 'marketplace',
        target_id: itemId,
        vote_type: rating.toString()
      });

    return { error };
  }
};

// Marketplace search and discovery
export const searchMarketplace = async (
  supabase: SupabaseClientType,
  query: string,
  options: {
    limit?: number;
    category?: string;
    max_price?: number;
  } = {}
) => {
  let dbQuery = supabase
    .from('marketplace')
    .select(`
      *,
      users!marketplace_author_id_fkey (
        username,
        avatar
      )
    `)
    .eq('is_approved', true)
    .or(`name.ilike.%${query}%, description.ilike.%${query}%`)
    .order('downloads', { ascending: false });

  if (options.limit) {
    dbQuery = dbQuery.limit(options.limit);
  }

  if (options.category) {
    dbQuery = dbQuery.eq('category', options.category);
  }

  if (options.max_price !== undefined) {
    dbQuery = dbQuery.lte('price', options.max_price);
  }

  const { data: items, error } = await dbQuery;
  return { items, error };
};

export const getFeaturedMarketplaceItems = async (
  supabase: SupabaseClientType,
  limit: number = 5
) => {
  const { data: items, error } = await supabase
    .from('marketplace')
    .select(`
      *,
      users!marketplace_author_id_fkey (
        username,
        avatar
      )
    `)
    .eq('is_approved', true)
    .eq('is_featured', true)
    .order('rating', { ascending: false })
    .order('downloads', { ascending: false })
    .limit(limit);

  return { items, error };
};

export const getPopularMarketplaceItems = async (
  supabase: SupabaseClientType,
  limit: number = 10
) => {
  const { data: items, error } = await supabase
    .from('marketplace')
    .select(`
      *,
      users!marketplace_author_id_fkey (
        username,
        avatar
      )
    `)
    .eq('is_approved', true)
    .order('downloads', { ascending: false })
    .order('rating', { ascending: false })
    .limit(limit);

  return { items, error };
};

export const getRecentMarketplaceItems = async (
  supabase: SupabaseClientType,
  limit: number = 10
) => {
  const { data: items, error } = await supabase
    .from('marketplace')
    .select(`
      *,
      users!marketplace_author_id_fkey (
        username,
        avatar
      )
    `)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { items, error };
};

// Transaction handling (for credit-based purchases)
export const purchaseMarketplaceItem = async (
  supabase: SupabaseClientType,
  itemId: string,
  buyerId: string
) => {
  // Get item details and buyer's credits
  const [itemResult, buyerResult] = await Promise.all([
    getMarketplaceItemById(supabase, itemId),
    supabase.from('users').select('credits').eq('id', buyerId).single()
  ]);

  if (itemResult.error || buyerResult.error) {
    return { 
      success: false, 
      error: itemResult.error || buyerResult.error 
    };
  }

  const item = itemResult.item!;
  const buyerCredits = buyerResult.data!.credits || 0;

  // Check if item is free
  if (item.price === 0) {
    await incrementDownloadCount(supabase, itemId);
    return { success: true, error: null };
  }

  // Check if buyer has enough credits
  if (buyerCredits < item.price) {
    return { 
      success: false, 
      error: new Error('Insufficient credits') 
    };
  }

  // Process transaction
  const [buyerUpdate, sellerUpdate] = await Promise.all([
    // Deduct credits from buyer
    supabase
      .from('users')
      .update({ 
        credits: buyerCredits - item.price,
        updated_at: new Date().toISOString()
      })
      .eq('id', buyerId),
    
    // Add credits to seller
    supabase.rpc('increment_user_credits', {
      user_id: item.author_id,
      amount: item.price
    })
  ]);

  if (buyerUpdate.error || sellerUpdate.error) {
    return { 
      success: false, 
      error: buyerUpdate.error || sellerUpdate.error 
    };
  }

  // Increment download count
  await incrementDownloadCount(supabase, itemId);

  return { success: true, error: null };
};