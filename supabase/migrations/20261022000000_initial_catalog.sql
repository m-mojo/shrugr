-- Shrugr catalog schema: editorial catalog only; provider availability is intentionally excluded.
create type public.film_mood as enum ('unwind', 'learn', 'hyped', 'feel', 'escape');
create type public.film_delivery as enum ('hooked', 'soak', 'brain', 'simple');
create type public.film_visual as enum ('energy', 'raw', 'composed', 'grounded');
create type public.catalog_status as enum ('draft', 'published', 'archived');

create table public.films (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  tmdb_id bigint unique check (tmdb_id is null or tmdb_id > 0),
  title text not null check (length(trim(title)) > 0),
  release_year smallint check (release_year is null or release_year between 1888 and 2200),
  runtime_minutes smallint check (runtime_minutes is null or runtime_minutes > 0),
  poster_path text,
  backdrop_path text,
  overview text not null default '',
  genres text[] not null default '{}',
  moods public.film_mood[] not null default '{}',
  delivery public.film_delivery[] not null default '{}',
  visual public.film_visual[] not null default '{}',
  interruption smallint check (interruption is null or interruption between 1 and 5),
  providers text[] not null default '{}',
  note text not null default '',
  reason text not null default '',
  status public.catalog_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.editorial_collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  intro text not null default '',
  status public.catalog_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.editorial_collection_films (
  collection_id uuid not null references public.editorial_collections(id) on delete cascade,
  film_id uuid not null references public.films(id) on delete cascade,
  position smallint not null default 0 check (position >= 0),
  primary key (collection_id, film_id),
  unique (collection_id, position)
);

create index films_status_runtime_idx on public.films (status, runtime_minutes);
create index editorial_collections_status_idx on public.editorial_collections (status);
create index editorial_collection_films_film_idx on public.editorial_collection_films (film_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger films_set_updated_at
before update on public.films
for each row execute function public.set_updated_at();

create trigger editorial_collections_set_updated_at
before update on public.editorial_collections
for each row execute function public.set_updated_at();

-- Admin membership is assigned out-of-band by a trusted project owner; users cannot self-promote.
create table public.catalog_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.is_catalog_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.catalog_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_catalog_admin() from public;
grant execute on function public.is_catalog_admin() to authenticated;

alter table public.films enable row level security;
alter table public.editorial_collections enable row level security;
alter table public.editorial_collection_films enable row level security;
alter table public.catalog_admins enable row level security;

-- Visitors may only read published catalog content. All catalog writes require explicit admin membership.
create policy "Published films are readable"
on public.films for select
to anon, authenticated
using (status = 'published');

create policy "Catalog admins manage films"
on public.films for all
to authenticated
using (public.is_catalog_admin())
with check (public.is_catalog_admin());

create policy "Published collections are readable"
on public.editorial_collections for select
to anon, authenticated
using (status = 'published');

create policy "Catalog admins manage collections"
on public.editorial_collections for all
to authenticated
using (public.is_catalog_admin())
with check (public.is_catalog_admin());

create policy "Published collection memberships are readable"
on public.editorial_collection_films for select
to anon, authenticated
using (
  exists (
    select 1
    from public.editorial_collections c
    join public.films f on f.id = editorial_collection_films.film_id
    where c.id = editorial_collection_films.collection_id
      and c.status = 'published'
      and f.status = 'published'
  )
);

create policy "Catalog admins manage collection memberships"
on public.editorial_collection_films for all
to authenticated
using (public.is_catalog_admin())
with check (public.is_catalog_admin());

create policy "Users can view their own catalog admin membership"
on public.catalog_admins for select
to authenticated
using (user_id = (select auth.uid()));

-- Supabase grants are bounded by RLS: anonymous users get read-only published data;
-- authenticated users may attempt writes, but policies permit them only for catalog admins.
grant select on public.films, public.editorial_collections, public.editorial_collection_films to anon, authenticated;
grant insert, update, delete on public.films, public.editorial_collections, public.editorial_collection_films to authenticated;
grant select on public.catalog_admins to authenticated;
