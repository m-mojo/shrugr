# shrugr

A small, context-aware movie picker: less scrolling, more watching. This MVP runs entirely in the browser with a curated local catalog—no API keys or backend required.

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
- Basic metadata configured for `https://shrugr.ro.to`.

## MVP notes

Group/couch mode is marked as coming soon. Streaming service availability and destination links are illustrative only in this prototype; there is no live provider lookup yet. Catalog tags and runtime data are hand-curated samples and should be validated before launch. Poster imagery is served by TMDB's public image CDN; follow TMDB attribution and usage requirements before production use.

## Next steps

- Verify TMDB terms/attribution and add a reliable localized streaming-availability provider.
- Move catalog and editorial tags into a managed data store, with a review workflow.
- Add analytics with privacy-conscious events and tune ranking from feedback.
- Implement couch mode, then realtime group rooms.
- Add a small set of useful, non-thin SEO landing pages and structured data where eligible.

Deployment domain target: `shrugr.ro.to` (DNS and deployment not configured by this project).
