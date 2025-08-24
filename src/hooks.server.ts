import { createServerClient } from '@supabase/ssr'
import { type Handle, redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

const supabase: Handle = async ({ event, resolve }) => {
  /**
   * Creates a Supabase client specific to this server request.
   * 
   * The Supabase client gets the Auth token from the request cookies.
   */
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (key) => event.cookies.get(key),
      /**
       * SvelteKit's cookies.set defaults to httpOnly: true, secure: true, and sameSite: 'lax'.
       * If you need to customize the cookie setting, you can override the default setting.
       * For example, some edge functions don't support httpOnly cookies.
       * In that case, you can set httpOnly to false in the cookie setting.
       */
      set: (key, value, options) => {
        // Ensure auth cookies are usable over HTTP in local dev to prevent auth loops
        const isProd = process.env.NODE_ENV === 'production'
        event.cookies.set(key, value, {
          ...options,
          path: '/',
          httpOnly: options?.httpOnly ?? true,
          sameSite: options?.sameSite ?? 'lax',
          secure: options?.secure ?? isProd,
        })
      },
      remove: (key, options) => {
        const isProd = process.env.NODE_ENV === 'production'
        event.cookies.delete(key, {
          ...options,
          path: '/',
          httpOnly: options?.httpOnly ?? true,
          sameSite: options?.sameSite ?? 'lax',
          secure: options?.secure ?? isProd,
        })
      },
    },
  })

  /**
   * Unlike `supabase.auth.getUser()`, `getSession()` doesn't make a request to the Supabase Auth server.
   * It just reads the JWT from the request cookies.
   * 
   * If you need user information that's guaranteed to be fresh, use `getUser()` instead.
   */
  event.locals.getSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession()
    return session
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range'
    },
  })
}

const authGuard: Handle = async ({ event, resolve }) => {
  const session = await event.locals.getSession()
  const url = event.url.pathname

  // Skip auth checks for auth-related routes to prevent loops
  if (url.startsWith('/auth/') || url === '/debug-profile') {
    return resolve(event)
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/community', '/edit']
  const isProtectedRoute = protectedRoutes.some(route => url.startsWith(route))

  if (isProtectedRoute && !session) {
    // Redirect to login if trying to access protected route without auth
    throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(url)}`)
  }

  // Add user data to locals for easy access in load functions
  if (session) {
    event.locals.user = session.user
  }

  return resolve(event)
}

export const handle = sequence(supabase, authGuard)