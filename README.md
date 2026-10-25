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

- Responsive, accessible solo movie-night flow with an auto-advancing screening and swipeable 3D parallax choice cards.
- Runtime, pause-friendliness, mood, delivery style, optional visual-vibe filters, and balanced/trending/recent/popular/TMDB top-rated/IMDb top-rated discovery modes; no streaming-service selection or availability claims in the picker.
- Deterministic catalog matching, viewing affirmations, explanations, alternatives, spin again, and seen-title skip.
- Static film detail pages and curated collection landing pages with canonical metadata, Movie/ItemList structured data, dynamic social preview images, and sitemap entries.
- Repeatable server-side TMDB metadata import script; imported metadata overlays the curated local catalog while preserving Shrugr-authored tags and notes.
- Supabase catalog schema with row-level security for curated catalog content. A server-only TMDB-to-Supabase catalog sync command refreshes metadata and posters while retaining Shrugr-authored tags. Admin editing and SEO routes are not yet database-backed.
- Live TMDB movie discovery on every recommendation request. Balanced mode samples popular and well-rated candidates; other modes use TMDB trending, release-date, popularity, or top-rated candidate sources. Vibe fit determines recommendation order; Top rated modes use their selected service's rating only to break vibe-score ties. IMDb top-rated mode uses IMDb ratings for the discovered TMDB candidate batch, not a complete IMDb-wide search. Live vibe estimates use TMDB genres, plot summaries, and keywords; they are not editorially reviewed. Recommendations and skipped titles are excluded across vibe changes on the same device. Pause-friendliness remains unknown for live titles. Live-search failures are shown to the user instead of falling back to the local catalog.
- Basic metadata configured for `https://shrugr.de5.net`.

## Current prototype notes

Group/couch mode is marked as coming soon. There is no live streaming-provider lookup. Live mood, delivery, and visual fit are estimates from genres, plot summaries, and keywords, not editorially reviewed. Poster imagery is served by TMDB's image CDN; follow TMDB attribution and usage requirements before production use.

## MVP focus

- Polish and validate the solo recommendation flow, accessibility, sample catalog, and clear demo/availability messaging.
- MVP includes TMDB metadata integration/imports, a managed catalog with editorial admin tools, programmatic SEO pages, structured data, and dynamic share cards. Film/collection SEO pages and a repeatable local import are now implemented.
- A production-managed catalog/admin workflow and scheduled imports still need an administrator access policy. Live provider availability, analytics, and realtime group rooms remain deferred.

## TMDB catalog import

Live picker discovery requires `TMDB_API_READ_ACCESS_TOKEN` in `.env.local` (and the equivalent server-side deployment variable); it does not require a Supabase secret. Each recommendation request searches TMDB's broad movie catalog and fetches a bounded candidate batch for runtime and poster details. If the token is missing or TMDB is unavailable, the picker reports the error and does not recommend from the local curated catalog.

For the separate curated database catalog, set server-only `SUPABASE_SECRET_KEY` (or legacy `service_role`) in `.env.local` and run `npm run catalog:sync`. `npm run catalog:posters:sync` refreshes poster paths and syncs those updates. These sync commands only upsert the locally curated seed list; they are not needed for live TMDB discovery.

## Optional IMDb ratings

Set the server-only `IMDB_RATINGS_TSV` variable to the path of IMDb's `title.ratings.tsv` dataset to display matching IMDb weighted user ratings on live movie picks and enable the `Top rated (IMDb)` discovery option. TMDB's external IDs link each live movie to its IMDb `tconst`; a sparse local index is used to read only requested ratings, and neither the ratings file nor the index is sent to the browser. Vibe matching remains the primary ranking signal.

Build its sparse lookup index once with `npm run imdb:ratings:index -- <path-to-title.ratings.tsv>`. The index is written beside the source file as `.idx.json` (or set `IMDB_RATINGS_INDEX` to a separate path); rebuild it after replacing the TSV. The ratings file and generated index are not included in this repository or deployment bundle. Keep both outside the public web root, and provide them to the server through a protected filesystem mount and environment variables. IMDb's downloadable datasets are subject to IMDb's non-commercial license and other terms; verify those terms for your use before deployment or redistribution.

Confirm TMDB API terms, attribution, rate limits, and caching rules before production use.

## Supabase catalog database

The initial database schema and setup instructions are in [supabase/README.md](./supabase/README.md). It uses RLS to expose only published curated content publicly and reserves catalog writes for explicitly authorized admins.

Deployment domain target: `shrugr.ro.to` (DNS and deployment not configured by this project).
