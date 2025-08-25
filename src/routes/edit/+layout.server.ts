import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types'

// Make sure the user is logged in and return the user data
export const load: LayoutServerLoad = async ({ locals, depends }) => {
	depends('supabase:auth')

    let session = locals.session;
    let user    = locals.user;

	if (!session || !user) {
		throw redirect(303, '/auth/login?sender=/edit')
	}

	return { session, user }
}

