# shrugr

A small, context-aware movie picker: less scrolling, more watching. The current prototype runs in the browser with a curated local catalog. The planned MVP adds server-side TMDB integration, a managed catalog/editorial workflow, and catalog-backed SEO pages.

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the project status, roadmap, acceptance criteria, and remaining work.

## Run locally

1. Install Node.js 20.9 or newer.
2. In this folder, run `npm install`.
3. Run `npm run dev` and open the local URL printed in the terminal.
4. Run `npm run build` to verify the production build.

## What works

- Responsive, accessible solo movie-night flow.
- Provider selection persisted in localStorage.
- Runtime, pause-friendliness, mood, delivery style, and optional visual-vibe filters.
- Deterministic catalog matching, viewing affirmations, explanations, alternatives, spin again, and seen-title skip.
- Static film detail pages and curated collection landing pages with canonical metadata, Movie/ItemList structured data, dynamic social preview images, and sitemap entries.
- Repeatable server-side TMDB metadata import script; imported metadata overlays the curated local catalog while preserving Shrugr-authored tags and notes.
- Basic metadata configured for `https://shrugr.ro.to`.

## Current prototype notes

Group/couch mode is marked as coming soon. Streaming service availability and destination links are illustrative only in this prototype; there is no live provider lookup yet. Catalog tags and runtime data are hand-curated samples and should be validated before launch. Poster imagery is served by TMDB's public image CDN; follow TMDB attribution and usage requirements before production use.

## MVP focus

- Polish and validate the solo recommendation flow, accessibility, sample catalog, and clear demo/availability messaging.
- MVP includes TMDB metadata integration/imports, a managed catalog with editorial admin tools, programmatic SEO pages, structured data, and dynamic share cards. Film/collection SEO pages and a repeatable local import are now implemented.
- A production-managed catalog/admin workflow and scheduled imports need a persistence/backend choice plus administrator access policy. Supabase is an option, not yet confirmed. Live provider availability, analytics, and realtime group rooms remain deferred.

## TMDB catalog import

1. Copy `.env.example` to `.env.local` and add your TMDB API Read Access Token. Keep the real token out of source control and browser code.
2. Run `npm run catalog:import` to fetch metadata for the seeded films and update `data/tmdb-metadata.json`. Re-running the importer refreshes records by stable TMDB ID while preserving Shrugr's editorial tags and notes in `lib/catalog.ts`.
3. Run `npm run build` to regenerate the static film and collection pages with the latest imported metadata.

The current importer is a local, repeatable seed import—not a scheduled production refresh. A managed editorial catalog/admin workflow still requires choosing a database/backend and defining administrator access. Confirm TMDB API terms, attribution, and caching rules before production use.

Deployment domain target: `shrugr.ro.to` (DNS and deployment not configured by this project).
