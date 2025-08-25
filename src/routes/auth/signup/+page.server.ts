import type { Actions, PageServerLoad } from './$types'
import { fail, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.session) {
    const redirectTo = url.searchParams.get('redirectTo') || '/community'
    throw redirect(303, redirectTo)
  }
  return {}
}

export const actions: Actions = {
  default: async ({ request, locals, url }) => {
    const form = await request.formData()
    const email = String(form.get('email') || '')
    const password = String(form.get('password') || '')
    const confirmPassword = String(form.get('confirmPassword') || '')
    const usernameRaw = String(form.get('username') || '')

    const username = usernameRaw.toLowerCase()

    if (!email || !password || !confirmPassword || !username) {
      return fail(400, { message: 'Please fill in all fields.' })
    }
    if (password !== confirmPassword) {
      return fail(400, { message: 'Passwords do not match.' })
    }
    if (password.length < 6) {
      return fail(400, { message: 'Password must be at least 6 characters.' })
    }
    if (username.length < 3 || username.length > 50) {
      return fail(400, { message: 'Username must be between 3-50 characters.' })
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return fail(400, { message: 'Username can only contain letters, numbers, underscores, and hyphens.' })
    }

    // Optional: check username availability. Don't fail hard on transient errors.
    try {
      const { data: rows } = await locals.supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .limit(1)
      if (Array.isArray(rows) && rows.length > 0) {
        return fail(400, { message: 'Username is already taken.' })
      }
    } catch {}

    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })
	if (error) {
		console.error('[signup] supabase error:', error);
		return fail(400, { message: error.message as string });
	  }

    const redirectTo = url.searchParams.get('redirectTo') || '/community'

    // If email confirmation is enabled there may be no session yet
    if (!data.session) {
      return {
        success: true,
        message: 'Account created! Check your email to verify your address.'
      }
    }

  throw redirect(303, redirectTo)
  }
}


