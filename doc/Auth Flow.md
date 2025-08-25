Auth Flow

### hooks.server.ts

- Create a request-scoped client with createServerClient.
- Add cookies.getAll/cookies.setAll with path: '/'.
- Implement locals.safeGetSession() using auth.getSession() + auth.getUser() to validate JWT.
- Set locals.session and locals.user each request.

### app.d.ts
- Define App.Locals with supabase, safeGetSession, session, user.
- Remove unused getSession (you did).

### routes/+layout.server.ts
- Return { session: locals.session, user: locals.user }.

### lib/supabase.ts
- Use createBrowserClient with PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.
- In onAuthStateChange, call invalidate('supabase:auth').
- Optional: ensure profile on sign-in.

### routes/auth/callback/+page.svelte
- Handle PKCE: exchangeCodeForSession(window.location.href).
- Handle email verify: verifyOtp({ type, token_hash }).
- Poll auth.getSession() briefly, then redirect.

### Protecting routes
- In hooks.server.ts, redirect when !locals.session for private paths.
- Or per-page +page.server.ts, check locals.session.

### Environment
- Set PUBLIC_SUPABASE_URL/PUBLIC_SUPABASE_ANON_KEY.
- Use the same domain and path to avoid cookie scope issues.

### Quick ways to practice:
- Add a console.log('session', locals.session?.user?.id) in +layout.server.ts to see the flow.
- Break something intentionally (e.g., remove setAll path) and watch sign-in fail; then fix it.
