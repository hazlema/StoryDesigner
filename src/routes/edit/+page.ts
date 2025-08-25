import type { PageLoad } from './$types';

// Make sure the user is logged in
export const load: PageLoad = ({ depends }) => {
	depends('supabase:auth');
};