# Supabase catalog setup

The initial schema is in [`migrations/20261022000000_initial_catalog.sql`](migrations/20261022000000_initial_catalog.sql). It models films, editorial collections, collection ordering, and explicit catalog-admin membership. Public reads are limited to published rows; catalog writes require an authenticated user explicitly listed as an admin. There are no provider-availability fields because those labels are not verified in this product yet.

## Create the project and apply the schema

1. Create a Supabase project in the Supabase dashboard and save its database password in a password manager. Do not put it in source control or send it in chat.
2. In the project's **SQL Editor**, open a new query, paste the migration SQL, and run it. Alternatively, use the Supabase CLI migration workflow after linking this repository to your project.
3. In SQL Editor, run [`migrations/20261023000000_seed_curated_catalog.sql`](migrations/20261023000000_seed_curated_catalog.sql) to populate the current curated films and collections. It is safe to re-run and publishes the existing 12-film catalog.
4. In **Authentication → Users**, create or invite your own admin user.
5. Copy that user's UUID from the dashboard. In SQL Editor, run the following after replacing the placeholder with the UUID (not the email):

   ```sql
   insert into public.catalog_admins (user_id)
   values ('00000000-0000-0000-0000-000000000000');
   ```

   This table intentionally has no client-side insert/update/delete policy, so users cannot grant themselves admin access.
6. The app uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for published catalog reads. These values are browser-visible; row-level security is the access boundary. Keep any `service_role`/secret key server-side only; it bypasses row-level security and must never be exposed in browser code.

## Current integration boundary

The initial migration creates the database schema and security policies; the seed migration inserts the current curated films and collections. The recommendation picker now reads published films from Supabase using the public key and falls back to its bundled local catalog when configuration, schema, connectivity, or published records are unavailable. Static SEO pages and collections continue to use local catalog data until their server-side data-source migration is implemented. The protected admin-authenticated editing workflow is still outstanding.

Before importing the current sample set, map each film's slug, TMDB ID, poster path, metadata, and Shrugr-authored tags into `public.films`; map curated collections and their film ordering into the two collection tables. TMDB API tokens are not database credentials and must remain in local/server environment configuration.

## Refresh TMDB data into Supabase

Add `SUPABASE_SECRET_KEY` to ignored `.env.local` from **Project Settings → API Keys → Secret keys**. This is server-only and bypasses RLS; never prefix it with `NEXT_PUBLIC_`, commit it, or expose it in browser code. (A legacy `service_role` key is also accepted.) Do not paste this key into chat; type it directly into the local `.env.local` file.

Run `npm run catalog:sync` to fetch TMDB metadata for the known seed IDs, update `data/tmdb-metadata.json`, and upsert those films into Supabase while preserving their Shrugr-authored recommendation tags, notes, and provider labels. Run `npm run catalog:posters:sync` for a poster-path-only refresh plus database sync. These commands do not discover/import arbitrary TMDB titles; new films still need editorial records/tags. The SQL seed migration is optional if you run the sync command, since the sync upserts the film rows itself; collections are seeded by that migration.
