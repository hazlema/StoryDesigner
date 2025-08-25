import { json, error } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import Config from '$lib/config';
import type { RequestHandler } from './$types';

// Only allow this endpoint in development
if (!Config.isDevelopment) {
	throw new Error('Delete user endpoint is only available in development mode');
}

// Create admin client with service role
const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});

export const DELETE: RequestHandler = async ({ request, locals }) => {
	try {
		// Double-check we're in development mode
		if (!Config.isDevelopment) {
			throw error(403, 'This endpoint is only available in development mode');
		}

		const { userId } = await request.json();

		if (!userId) {
			throw error(400, 'User ID is required');
		}

		// Get current session to verify ownership (optional security check)
		const { session } = await locals.safeGetSession();
		if (!session || session.user.id !== userId) {
			throw error(403, 'You can only delete your own user account');
		}

		// Delete from auth (this will cascade to related tables if properly set up)
		const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
		
		if (deleteError) {
			console.error('Error deleting user:', deleteError);
			throw error(500, `Failed to delete user: ${deleteError.message}`);
		}

		// Also cleanup from custom users table (if needed)
		const { error: dbError } = await supabaseAdmin
			.from('users')
			.delete()
			.eq('id', userId);

		if (dbError) {
			console.error('Error deleting from users table:', dbError);
			// Don't throw here - auth deletion succeeded, this is just cleanup
		}

		return json({ success: true, message: 'User deleted successfully' });

	} catch (err) {
		console.error('Delete user error:', err);
		if (err instanceof Error) {
			throw error(500, err.message);
		}
		throw error(500, 'Failed to delete user');
	}
};