import type { Actions, PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ locals }) => {
  try {
    await locals.supabase.auth.signOut()
  } finally {
    throw redirect(303, '/')
  }
}

export const actions: Actions = {
  default: async ({ locals }) => {
    try {
      await locals.supabase.auth.signOut()
    } finally {
      throw redirect(303, '/')
    }
  }
}


