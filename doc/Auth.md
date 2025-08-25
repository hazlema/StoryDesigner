# Authentication (SvelteKit + Supabase)

This document explains the working auth architecture in this repo, the rationale for each choice, and how to debug issues quickly. It includes a local quick‑start, file responsibilities, OAuth behavior, Svelte 5/Tailwind v4 conventions, and a troubleshooting checklist.

## Quick start (local)

- Env vars
  - PUBLIC_SUPABASE_URL
  - PUBLIC_SUPABASE_ANON_KEY
- Supabase Auth → URL Configuration
  - Site URL: http://localhost:5173
  - Additional Redirect URLs:
    - http://localhost:5173/auth/callback
    - http://localhost:5173/auth/confirm (optional)
- Email/password
  - Forms post to server actions (no client hangs); failures display inline.
- OAuth (Google)
  - Client starts OAuth with redirectTo = /auth/callback?redirectTo=…
  - Callback page uses listener + polling + final session check and then redirects to the intended target.

Tip: Allow cookies for localhost (disable Brave/Chrome shields for testing).

---

## Architecture overview

- SvelteKit (Svelte 5) SSR + Supabase Auth
- Server
  - src/hooks.server.ts creates a request‑scoped Supabase client
  - Validates JWT via supabase.auth.getUser() and exposes on locals:
    - locals.supabase – server client
    - locals.session – current session or null
    - locals.user – validated user or null
- Data
  - src/routes/+layout.server.ts returns { session, user } and declares depends('supabase:auth') so auth‑dependent loads re‑run after client invalidates.

Why: Server‑validated user avoids trusting unverified session.user in the browser.

---

## Files and responsibilities

### 1) Server hooks – request client + validated session
File: src/hooks.server.ts

- Create per‑request client; ensure cookies use path: '/'.
- Define safeGetSession() that returns { session, user } only if getUser() succeeds (JWT verified).
- Set locals.session and locals.user on every request.
- Use throw redirect(303, …) in guards (never call redirect without throw).

### 2) Types – app.d.ts
File: src/app.d.ts

- Locals includes: supabase, safeGetSession, session, user.
- Removed legacy getSession type.

### 3) Server layout load – validated user/session
File: src/routes/+layout.server.ts

- Revalidate on auth change and return validated data:

```ts
export const load: LayoutServerLoad = async ({ locals, depends }) => {
  depends('supabase:auth');
  return { session: locals.session, user: locals.user };
};
```

### 4) Browser client + helpers
File: src/lib/supabase.ts

- Client config:
  - autoRefreshToken: true
  - persistSession: true
  - detectSessionInUrl: true
- Idempotent profile creation using upsert by id (no 409s):

```ts
export const ensureUserProfile = async (authUser: { id: string; email?: string; user_metadata?: Record<string, any> } | null) => {
  if (!authUser) return null;
  const username = (
    authUser.user_metadata?.username ??
    authUser.user_metadata?.user_name ??
    authUser.user_metadata?.full_name ??
    authUser.email?.split('@')[0] ??
    `user_${Math.random().toString(36).slice(2, 11)}`
  ).toLowerCase();

  const { data, error } = await supabase
    .from('users')
    .upsert([{ id: authUser.id, username, email: authUser.email || '', avatar: authUser.user_metadata?.avatar_url || null }], { onConflict: 'id' })
    .select()
    .single();
  return error ? null : data;
};
```

### 5) Client layout – auth listener + invalidate
File: src/routes/+layout.svelte

- Listen for SIGNED_IN/SIGNED_OUT; on SIGNED_IN do ensureUserProfile non‑blocking; call invalidate('supabase:auth') to rerun server loads that depend on auth.

### 6) Email/password via server actions
Files:
- src/routes/auth/login/+page.server.ts – signs in server‑side; redirects on success; fail(400, { message }) on error.
- src/routes/auth/login/+page.svelte – method="post" form; token‑based styles; shows inline messages.
- src/routes/auth/signup/+page.server.ts – validates username/email; calls auth.signUp; returns success/fail.
- src/routes/auth/signup/+page.svelte – use:enhance to render action results; token‑based styles.

### 7) OAuth (Google) – callback and guards
Files:
- src/routes/auth/login/+page.svelte and src/routes/auth/signup/+page.svelte
  - Always start OAuth with the same callback and preserve intent:

```ts
const params = new URLSearchParams(window.location.search);
const redirectTo = params.get('redirectTo') || '/community';
const callback = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;
await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callback } });
```

- src/routes/auth/callback/+page.svelte: 3‑step guard against timing races:
  1) Immediate check – if getUser() returns a user, ensure profile (non‑blocking) and goto(redirectTo)
  2) Auth listener – on SIGNED_IN, ensure profile non‑blocking and goto(redirectTo)
  3) Poll fallback – up to ~3s calling getUser() then goto(redirectTo)
  4) Final fallback – if getSession() shows a session, redirect anyway
  5) didRedirect flag prevents double navigation

### 8) Logout
Files:
- src/routes/auth/logout/+page.server.ts – server‑side signOut and redirect
- src/routes/auth/logout/+page.svelte – spinner/confirmation while redirect happens

### 9) Route protection

```ts
export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.session || !locals.user) throw redirect(303, '/auth/login');
  return { session: locals.session, user: locals.user };
};
```

---

## Svelte 5 + Tailwind v4 conventions

- Use `$app/state` (not `$app/stores`).
- Prefer token classes from src/app.css:
  - bg-background, text-foreground, border, bg-card, text-muted-foreground,
  - bg-primary, text-primary-foreground, bg-accent, bg-destructive, etc.
- Add `depends('supabase:auth')` in loads that should refresh on auth; pair with `invalidate('supabase:auth')` in listeners.

---

## Troubleshooting

1) Callback page stuck on “processing”
   - You should see one of:
     - [callback] immediate getUser: true → instant redirect
     - [callback] auth event: SIGNED_IN → redirect
     - [callback] final session check hasSession: true → redirect
   - If not, allow cookies (disable privacy shields for localhost).

2) TS: “property X does not exist on never”
   - Type state explicitly with generated Database types, e.g.:
     `let profile = $state<Database['public']['Tables']['users']['Row'] | null>(null);`
   - Narrow before use: `if (profile) { … }`.

3) 409 conflict when creating profile
   - Use upsert({ onConflict: 'id' }) or pre‑check existence. We use upsert by id (idempotent).

4) “getSession is not a function”
   - We removed locals.getSession; read locals.session/locals.user (populated by safeGetSession) and return them from server loads.

5) Redirect loops / SSR not seeing login
   - Confirm cookie writes in hooks.server.ts use `path: '/'`.

6) OAuth won’t redirect
   - Dashboard URLs include /auth/callback (and /auth/confirm if you route through it).
   - Client always uses the same callback and preserves redirectTo.
   - Keep the 3‑step callback logic; it handles SDK/code timing races.

---

## What changed (high level)

- Server validates JWT on every request; client never trusts unverified session.user.
- Session/user centralized on locals; server returns them; client reads via data.
- Profile creation is idempotent (upsert by id).
- Email/password via server actions; client forms are progressive and robust.
- OAuth callback uses listener + polling + final fallback; redirectTo preserved end‑to‑end.
- Svelte 5 store usage ($app/state) + Tailwind token classes (no legacy palettes).

---

## Key paths

- Server
  - src/hooks.server.ts
  - src/routes/+layout.server.ts
  - src/routes/auth/login/+page.server.ts
  - src/routes/auth/signup/+page.server.ts
  - src/routes/auth/logout/+page.server.ts
- Client
  - src/routes/+layout.svelte
  - src/routes/auth/login/+page.svelte
  - src/routes/auth/signup/+page.svelte
  - src/routes/auth/callback/+page.svelte
  - src/routes/auth/logout/+page.svelte
- Shared
  - src/lib/supabase.ts
  - src/lib/database.types.ts

If you add more providers, reuse the Google pattern: direct to `/auth/callback?redirectTo=…`, keep the 3‑stage guard in the callback, and whitelist the URLs in Supabase.
