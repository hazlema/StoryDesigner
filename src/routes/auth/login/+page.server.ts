import type { Actions, PageServerLoad } from './$types'
import { fail, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.session) {
		const redirectTo = url.searchParams.get('sender') || '/community'
		throw redirect(303, redirectTo)
	}
	return {}
}

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const form     = await request.formData()
		const email    = String(form.get('email') || '')
		const password = String(form.get('password') || '')
		const sender   = String(form.get('sender') || '')

		if (!email || !password) {
			return fail(400, { message: 'Please provide email and password.' })
		}

		const { error } = await locals.supabase.auth.signInWithPassword({ email, password })
		if (error) {
			return fail(400, { message: error.message })
		}

		const redirectTo = sender || '/community'
		throw redirect(303, redirectTo)
	}
}


