# shrugr

A context-aware movie picker: less scrolling, more watching. The solo picker fetches live movie candidates from TMDB for every recommendation; it does not substitute the small curated catalog when live discovery fails.

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the project status, roadmap, acceptance criteria, and remaining work.

## Tech stack

- **Languages:** TypeScript, JavaScript, HTML, CSS, SQL (PostgreSQL)
- **Frameworks:** Next.js (React), Tailwind CSS
- **Runtime and services:** Node.js, Supabase, TMDB API
- **UI icons:** Lucide React

## Run locally

1. Install Node.js 20.9 or newer.
2. In this folder, run `npm install`.
3. Copy `.env.example` to `.env.local`, set `TMDB_API_READ_ACCESS_TOKEN`, then run `npm run dev` and open the local URL printed in the terminal.
4. Run `npm run build` to verify the production build.

## What works

- Responsive, accessible solo movie-night flow.
- Provider selection persisted in localStorage.
- Runtime, pause-friendliness, mood, delivery style, and optional visual-vibe filters.
- Deterministic catalog matching, viewing affirmations, explanations, alternatives, spin again, and seen-title skip.
- Static film detail pages and curated collection landing pages with canonical metadata, Movie/ItemList structured data, dynamic social preview images, and sitemap entries.
- Repeatable server-side TMDB metadata import script; imported metadata overlays the curated local catalog while preserving Shrugr-authored tags and notes.
- Supabase catalog schema with row-level security for curated catalog content. A server-only TMDB-to-Supabase catalog sync command refreshes metadata and posters while retaining Shrugr-authored tags. Admin editing and SEO routes are not yet database-backed.
- Live TMDB movie discovery on every recommendation request. The server samples randomized pages from TMDB discovery and fetches a bounded set of movie details, then applies generic genre-derived vibe scoring. It is not an exhaustive scan or TMDB editorial ranking; streaming availability and pause-friendliness remain unknown. Live-search failures are shown to the user instead of falling back to the local catalog.
- Basic metadata configured for `https://shrugr.ro.to`.

## Current prototype notes

Group/couch mode is marked as coming soon. There is no live streaming-provider lookup. Live film fit beyond runtime and genre is a broad estimate, not editorially reviewed. Poster imagery is served by TMDB's image CDN; follow TMDB attribution and usage requirements before production use.

## MVP focus

- Polish and validate the solo recommendation flow, accessibility, sample catalog, and clear demo/availability messaging.
- MVP includes TMDB metadata integration/imports, a managed catalog with editorial admin tools, programmatic SEO pages, structured data, and dynamic share cards. Film/collection SEO pages and a repeatable local import are now implemented.
- A production-managed catalog/admin workflow and scheduled imports still need an administrator access policy. Live provider availability, analytics, and realtime group rooms remain deferred.

## TMDB catalog import

Live picker discovery requires `TMDB_API_READ_ACCESS_TOKEN` in `.env.local` (and the equivalent server-side deployment variable); it does not require a Supabase secret. Each recommendation request searches TMDB's broad movie catalog and fetches a bounded candidate batch for runtime and poster details. If the token is missing or TMDB is unavailable, the picker reports the error and does not recommend from the local curated catalog.

For the separate curated database catalog, set server-only `SUPABASE_SECRET_KEY` (or legacy `service_role`) in `.env.local` and run `npm run catalog:sync`. `npm run catalog:posters:sync` refreshes poster paths and syncs those updates. These sync commands only upsert the locally curated seed list; they are not needed for live TMDB discovery.

Confirm TMDB API terms, attribution, rate limits, and caching rules before production use.

## Supabase catalog database

The initial database schema and setup instructions are in [supabase/README.md](./supabase/README.md). It uses RLS to expose only published curated content publicly and reserves catalog writes for explicitly authorized admins.

Deployment domain target: `shrugr.ro.to` (DNS and deployment not configured by this project).
