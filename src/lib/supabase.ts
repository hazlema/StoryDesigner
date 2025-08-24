import { createBrowserClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { Database } from './database.types'

console.log('Supabase config check:', {
  url: PUBLIC_SUPABASE_URL,
  key: PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
});

if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  return user
}

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
    
  if (error) {
    console.error('Error getting user profile:', error)
    return null
  }
  
  return data
}

// Helper function to update user profile
export const updateUserProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
    
  if (error) {
    console.error('Error updating user profile:', error)
    return null
  }
  
  return data
}

// Helper function to ensure user profile exists
export const ensureUserProfile = async (authUser: any) => {
  if (!authUser) return null

  // Check if profile exists
  const existingProfile = await getUserProfile(authUser.id)
  if (existingProfile) {
    return existingProfile
  }

  // Create profile if it doesn't exist
  const username = authUser.user_metadata?.username || 
    authUser.user_metadata?.user_name ||
    authUser.user_metadata?.full_name ||
    authUser.email?.split('@')[0] || 
    `user_${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await supabase
    .from('users')
    .insert({
      id: authUser.id,
      username: username.toLowerCase(),
      email: authUser.email || '',
      avatar: authUser.user_metadata?.avatar_url || null
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    return null
  }

  return data
}