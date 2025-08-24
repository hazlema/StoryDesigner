# Postgres / Supabase RLS — One‑Page Cheat Sheet

## Mental Model
- **RLS = hidden filters** evaluated on *every* statement.
- **USING ( … )** — acts like a hidden `WHERE`:
  - Checked on **SELECT**, **DELETE**, and for **UPDATE** (to pick target rows).
- **WITH CHECK ( … )** — acts like a hidden `CHECK`:
  - Checked on **INSERT**, and on **UPDATE** (new values must satisfy it).
- **Deny-by-default**: If no applicable policy allows the action, it’s blocked.

### Operation → Which clause matters
| Operation | USING | WITH CHECK |
|---|---|---|
| SELECT | ✅ | — |
| DELETE | ✅ | — |
| UPDATE | ✅ (target rows) | ✅ (new values) |
| INSERT | — | ✅ |

---

## Core Patterns
### 1) Owner-only rows (classic)
```sql
-- Read
create policy "select_own" on tbl for select using (auth.uid() = user_id);
-- Create
create policy "insert_own" on tbl for insert with check (auth.uid() = user_id);
-- Update
create policy "update_own" on tbl for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- (Optional) Delete
-- create policy "delete_own" on tbl for delete using (auth.uid() = user_id);
```

### 2) Public read, owner write
```sql
create policy "read_public"  on tbl for select using (true);
create policy "insert_own"   on tbl for insert with check (auth.uid() = user_id);
create policy "update_own"   on tbl for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### 3) Drafts/Moderation (see own drafts + approved public)
```sql
create policy "read_approved_or_own" on tbl for select using (is_approved or auth.uid() = user_id);
```

### 4) Soft delete (hide unless admin/owner)
```sql
create policy "read_not_deleted_or_admin_or_owner"
on tbl for select using (deleted_at is null or auth.role() = 'service_role' or auth.uid() = user_id);
```

### 5) Service-role escape hatch (server key only)
```sql
create policy "service_all" on tbl for all
using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
```

### 6) Multi-tenant (org/team)
```sql
-- Expect org_id on rows and 'org_id' claim in the JWT
create policy "tenant_read" on tbl for select
using (org_id = (auth.jwt() ->> 'org_id')::uuid);
create policy "tenant_write" on tbl for insert
with check (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

---

## Signup/Profile Pattern (RLS-safe)
Use a trigger with `SECURITY DEFINER` to create your profile row when `auth.users` inserts.
```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, username, email, avatar)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'user_'||left(new.id::text,8)), coalesce(new.email,''), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end$$;

revoke all on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
```

---

## Common Pitfalls
- **INSERT blocked** because you forgot `WITH CHECK` (USING doesn’t apply to INSERT).
- **Authors can’t see drafts**: `select using (is_approved)` should usually be `is_approved OR auth.uid() = user_id`.
- **Emails/PII leaked** via `USING (true)` on a table with private columns → use a **view** to expose only public fields.
- **SECURITY DEFINER safety**: always `set search_path = public` inside the function to avoid function hijack via search_path.
- **GRANTs vs RLS**: both must allow the action; Supabase grants basics, RLS limits rows.

---

## Quick Testing Snippets
```sql
-- List policies on a table
select * from pg_policies where schemaname='public' and tablename='tbl';

-- Is RLS enabled?
select relrowsecurity from pg_class where relname='tbl';

-- Simulate a user (psql session) [requires superuser]
set local role authenticated;
set local request.jwt.claims = '{"sub":"<uuid>","role":"authenticated","org_id":"<uuid>"}';
-- Now run your selects/inserts to test policies.
```

---

## Upgrade Strategy
- Make policy changes **idempotent**: `drop policy if exists ...; create policy ...` in one migration.
- Add a one-time script to stamp `service_all` and fix missing `WITH CHECK` on “manage own” tables.
- Consider an event trigger to auto-enable RLS on new tables.
