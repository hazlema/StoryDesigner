// src/lib/supabase.ts -- Helper functions
import type { Database } from './database.types'
import type { SupabaseClient } from '@supabase/supabase-js';

import { createBrowserClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
	throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create Supabase client
export const supabase: SupabaseClient<Database> =
	createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
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
export const updateUserProfile = async (
	userId: string,
	updates: Database['public']['Tables']['users']['Update']
) => {
	const { data, error } = await supabase
		.from('users')
		.update(updates)
		.eq('id', userId)
		.select()
		.single();

	if (error) {
		console.error('Error updating user profile:', error)
		return null
	}

	return data
};

// Helper function to ensure user profile exists
export const ensureUserProfile = async (
	authUser: { id: string; email?: string; user_metadata?: Record<string, any> } | null
) => {
	// Error
	if (!authUser) return null

	console.log('Ensuring user profile for', authUser.id);
	
	//
	// Dont put a user exists check here it creates a loop in the Auth
	// update with an upsert instead
	//
	const username =
		(authUser.user_metadata?.username ??
			authUser.user_metadata?.user_name ??
			authUser.user_metadata?.full_name ??
			authUser.email?.split('@')[0] ??
			`user_${Math.random().toString(36).slice(2, 11)}`).toLowerCase()

	const { data, error } = await supabase
		.from('users')
		.upsert([
			{
				id: authUser.id,
				username,
				email: authUser.email || '',
				avatar: authUser.user_metadata?.avatar_url || null,
			} as Database['public']['Tables']['users']['Insert']
		], { onConflict: 'id' })
		.select()
		.single()

	if (error) return null
	return data
}