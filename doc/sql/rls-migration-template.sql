-- Idempotent RLS policy upgrade template
-- Adjust <TABLE> and <OWNER_COL>/<TENANT_COL> as needed, or run the batch block.

-- Example: ensure service_all exists everywhere in public schema
do $$
declare r record;
begin
  for r in
    select n.nspname as schemaname, c.relname as tablename
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where c.relkind='r' and n.nspname='public'
  loop
    execute format('alter table %I.%I enable row level security;', r.schemaname, r.tablename);
    if not exists (
      select 1 from pg_policies
      where schemaname=r.schemaname and tablename=r.tablename and policyname='service_all'
    ) then
      execute format($f$
        create policy "service_all" on %I.%I for all
        using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
      $f$, r.schemaname, r.tablename);
    end if;
  end loop;
end$$;

-- Example: fix classic mistake (USING but no WITH CHECK) for owner-managed tables
-- (Run per table where rows are owned by user_id)
do $$
begin
  -- Votes
  drop policy if exists "Users can manage own votes" on public.votes;
  create policy "Votes: manage own" on public.votes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

  -- Follows
  drop policy if exists "Users can manage own follows" on public.follows;
  create policy "Follows: manage own" on public.follows
  for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

  -- Bookmarks
  drop policy if exists "Users can manage own bookmarks" on public.bookmarks;
  create policy "Bookmarks: manage own" on public.bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
end$$;

-- Example: marketplace/ stories draft visibility (approved OR own)
do $$
begin
  drop policy if exists "Marketplace items are viewable by everyone" on public.marketplace;
  create policy "Marketplace: view approved or own" on public.marketplace
  for select using (is_approved = true or auth.uid() = author_id);

  drop policy if exists "Public stories are viewable by everyone" on public.stories;
  create policy "Stories: view public or own" on public.stories
  for select using (is_public = true or auth.uid() = author_id);
end$$;

-- Profile creation trigger (safe)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, username, email, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || left(new.id::text, 8)),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  )
  on conflict (id) do nothing;
  return new;
end$$;

revoke all on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
