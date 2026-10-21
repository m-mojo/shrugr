# Shrugr Implementation Plan

**Product:** Shrugr — a context-aware movie picker  
**Production domain target:** `shrugr.ro.to`  
**Status date:** 2026-10-22  
**Plan status:** Local foundation, the core solo flow, the soft-preference recommendation contract, and the basic SEO scaffolding are implemented. The next milestone is product-grade catalog/data integration, live availability, and the full hosting/backend setup for Vercel + Supabase with a free-tier path.

## Product goal

Help someone choose a film for their current moment in under 45 seconds. Match against time, interruption likelihood, mood, attention/delivery preference, visual style, and services they selected. Return one clear recommendation, a human viewing note, transparent reasons, and a small number of alternatives.

## Current implementation snapshot

### Implemented in this repository
- Next.js App Router application with TypeScript, Tailwind CSS, local curated sample data, and project metadata for the target domain.
- Responsive, dark cinematic home, setup, preference, and result screens.
- Solo recommendation flow with runtime, interruption-friendliness, mood, delivery, and optional visual-style selections.
- Provider preferences saved in browser `localStorage`.
- Deterministic client-side filtering/ranking, viewing affirmations, fit explanations, backup choices, spin-again, and seen-title skipping.
- Empty-match recovery state and a production build that passes.
- Centralized recommendation engine in `lib/recommendation.ts` for consistent hard-filter and ranking behavior across the app.
- Automated regression tests covering hard filters, seen-title exclusions, and empty-match fallback logic via `npm test`.
- Result-screen demo messaging for sample provider labels and availability so the UI does not overstate verified provider status.
- Basic SEO scaffolding with `app/robots.ts` and `app/sitemap.ts` and remote-image configuration for poster assets.
- Couch/group entry remains a coming-soon placeholder; no group recommendation behavior is implemented.
- Decision lock-in: TMDB is the source of truth for movie metadata and poster/backdrop assets; live availability is the target behavior for the MVP; mood, delivery, and visual inputs are now defined as soft ranking signals rather than strict hard filters; watch links are intended to be real and user-selectable based on enabled services.

### Known prototype limitations
- Catalog entries, tags, and ranking are local sample data; they are not an editorially reviewed production catalog.
- Provider availability and watch destinations are illustrative. There is no live provider lookup or verified deep linking, and some UI copy risks presenting the sample data as current.
- Current recommendation tests are a small baseline, not comprehensive scenario coverage. They do not yet verify no-provider behavior, all titles seen, repeated spins, or ranking among multiple eligible candidates.
- Some result copy still reads like provider availability is confirmed even though the action is only a demo; review this wording before release.
- Runtime band semantics need review: the displayed 90–120 minute option currently imposes a 120-minute ceiling but no 90-minute lower bound.
- Recommendation behavior is now aligned with the product contract: mood, delivery, and visual choices rank candidates without silently excluding valid films, while hard filters and no-match states remain visible and actionable.
- Backup choices are the next ranked results, not yet deliberately differentiated by alternate pacing/intent. Affirmation handling is partly curated but also has generic runtime fallbacks.
- No Supabase, TMDB server integration, admin/tagging workflow, user accounts, analytics, group sync, or SEO landing-page generator is implemented.
- Confirm TMDB image/API attribution and usage terms before production. The app currently uses remote poster images.
- The domain is a target only: DNS, hosting, and deployment are not configured here.

## Delivery roadmap

Checklist notation: `[x]` complete, `[~]` partially implemented, `[ ]` not yet complete.

### Phase 0 — Foundation and project verification
**Status: Complete for the local prototype.**
- [x] Create Next.js App Router + TypeScript + Tailwind project structure.
- [x] Add local sample catalog and responsive UI shell.
- [x] Add basic page metadata for `shrugr.ro.to`.
- [x] Confirm production build compiles.

**Completion check:** `npm run build` completes successfully from the project root.

### Phase 1 — Solo MVP quality and product validation
**Status: Core solo flow implemented; content review, edge-case coverage, accessibility validation, and a few semantics/copy fixes remain open.**
- [x] Provider selection with local persistence.
- [x] Time, interruption, mood, delivery, and optional visual inputs.
- [x] Single result, affirmation, reasons, backups, seen-title replacement, and empty-match recovery.
- [ ] Review each sample film’s metadata, tags, runtimes, note, poster, and service labels; reconcile providers shown in sample titles with the selectable provider list.
- [ ] Complete scenario verification for no providers, no matches, all titles seen, repeated spins, and ranking among multiple eligible films. Current automated tests cover only a subset.
- [x] Add baseline automated tests for provider/runtime filtering, seen-title exclusion, and no-match fallback.
- [ ] Ensure all result copy and watch actions clearly distinguish illustrative provider labels from verified availability; the current action is a demo and some labels imply confirmed availability.
- [ ] Confirm and implement the intended runtime boundaries (the 90–120 minute option currently has no 90-minute minimum).
- [x] Decide that mood, delivery, and visual preferences are soft ranking signals rather than strict hard filters. Align code, explanations, and tests to this behavior.
- [ ] Validate keyboard navigation, screen-reader labels, contrast, reduced motion, and small-screen layout; basic semantic controls and styles exist, but validation is incomplete.

**Acceptance criteria:** a first-time mobile user can complete the flow quickly; hard constraints are honored; no match is explained instead of silently relaxing filters; recommendation explanations correspond to actual data; provider availability is not presented as verified.

### Phase 2 — Production catalog and data pipeline
**Status: Not started; TMDB is the selected source and daily refresh is the target.**
1. Confirm TMDB API access, rate-limit handling, attribution requirements, and caching policy. Define a daily refresh job and a small cache layer to keep public requests low and avoid hitting rate limits.
2. Lock the managed database and deployment arrangement to Vercel + Supabase. Define migrations, backups, environments, and project ownership before importing production data.
3. Implement the production catalog model: TMDB ID and metadata; runtime/year/poster/backdrop; editorial delivery, density, interruption and pause-complexity tags; cinematography axes/quadrant; intent tags; curated viewing note; and source/provenance fields.
4. Build secure, repeatable server-side ingestion and refresh jobs. Keep API credentials server-side, validate external payloads, respect provider limits, and make imports idempotent.
5. Build a minimal internal tagging/review workflow. Seed a smaller quality-reviewed catalog first, then scale toward the proposed 500+ titles only when tagging definitions and review capacity are proven.
6. Add catalog checks for duplicate IDs, missing or contradictory tags, invalid runtimes, unsupported values, poster failures, and stale/broken destination links.
7. Add localized availability snapshots with territory and checked-at timestamps. Distinguish streaming, rent/buy, unknown, and stale states; show a watch CTA only when its destination is verified and permitted.
8. Use user-selected streaming subscriptions as a hard filter in the MVP: providers chosen by the user should be treated as eligible destinations, while unavailable or stale provider data should be hidden or clearly marked as unverified.

**Acceptance criteria:** catalog changes are auditable and repeatable; secrets never reach client bundles; editorial fields have documented definitions; availability is territory-specific and timestamped; unknown or stale availability is not presented as current.

### Phase 3 — Matching refinement and result experience
**Status: Soft-preference ranking is now implemented in the engine; the remaining work is refinement, editorial quality, and accessibility validation.**
1. [x] Review the full flow against the three personas: strict runtime and pause-friendliness for the Busy Pauser; delivery and visual-aesthetic fit for the Vibe Seeker; and clear constraint compromise for groups (group behavior remains Phase 4).
2. [x] Finalize which inputs are hard filters versus soft ranking signals. Mood, delivery, and visual selections now act as soft ranking signals rather than strict filters, while the no-match state remains visible and actionable.
3. [~] Complete the optional visual-vibe card matrix already represented in the prototype: high-energy/expressive, raw/immersive, precise/composed, and quiet/grounded. Verify text alternatives and the skip/any-style choice.
4. [~] Formalize the curated affirmation library and selection rules for delivery style, narrative density/pacing, themes, and interruption safety. Film notes exist, but generic runtime fallbacks remain; keep notes editorially authored.
5. [~] Refine alternatives into two intentionally distinct backups (alternate pacing for the same intent, and alternate intent for similar pacing). The “I’ve seen this” action and seen-title exclusion exist; purposeful backup selection and exhaustion tests remain.
6. [ ] Add or verify measured transitions and micro-interactions for context steps and result reveal. Respect reduced-motion preferences and keep the primary decision path usable without animation.
7. [ ] Validate mobile-first card chunking, accessible controls, keyboard and screen-reader behavior, color contrast, and the under-45-second target with usability checks.

**Acceptance criteria:** optional style selection never blocks completion; recommendation reasons and affirmations are traceable to curated data; backups are meaningfully differentiated; seen-title replacement and empty states remain predictable; accessibility and mobile checks pass.

### Phase 4 — Group recommendation and shared rooms
**Status: Not started; couch mode is currently a coming-soon entry point, but the scope is now confirmed as both single-device and multi-device with Supabase Realtime.**
1. Ship single-device couch mode first. Let the group enter or agree on constraints without requiring accounts or multiple devices.
2. Aggregate hard constraints using the lowest common denominator: minimum runtime ceiling, intersection of selected services, and pause-friendly filtering when any participant expects interruptions. Explain empty intersections and let users explicitly change constraints.
3. Aggregate mood and delivery preferences as soft weights; select a compromise near the shared preference overlap rather than an extreme outlier. Present the rationale without claiming unanimous preference.
4. Validate couch mode before adding multi-device sync. Define the room lifecycle, host controls, participant inputs, join-code entropy/expiry, reconnect behavior, reset/reveal flow, and data retention.
5. Implement room creation and joining with a short code/QR, participant completion state, and host-triggered recommendation using Supabase Realtime for live synchronization.
6. Add abuse controls, rate limits, room expiration/cleanup, and graceful handling of disconnects, late joiners, duplicate submissions, and insufficient participants.

**Acceptance criteria:** group hard constraints cannot be bypassed; empty overlap is actionable; participants can understand the compromise; rooms are private by design, expire predictably, and recover safely from disconnects.

### Phase 5 — Search, sharing, and programmatic SEO
**Status: Basic SEO scaffolding implemented; page generation and content strategy remain open and now confirmed as required.**
1. [x] Add a baseline `robots.txt` policy and `sitemap.xml` scaffold for the app shell.
2. [ ] Begin with a small set of manually reviewed, useful intent pages targeting queries such as short runtime + mood + provider. Build around verified catalog data rather than creating every possible filter combination.
3. [ ] Add canonical URLs, metadata, sitemap, robots policy, and index/noindex rules. Only index pages with sufficient unique, accurate, current content; prevent thin, duplicate, or empty combinations from entering search.
4. [ ] Generate contextual landing routes (for example, fast-paced science-fiction under 90 minutes on a selected provider) only after templates provide distinct editorial value and availability freshness is dependable.
5. [ ] Add accurate structured data where eligible: Movie for film-specific content and ItemList for genuine lists. Validate markup and ensure it matches visible page content; do not promise rich-result placement.
6. [ ] Add dynamic Open Graph previews for curated landing pages and deliberate user-shared results. Keep private session inputs and group-room data out of URLs, metadata, and previews unless the user explicitly shares them.
7. [ ] Track organic landing-page quality and search performance using privacy-conscious analytics, then prune or noindex pages that are stale or not useful.
8. [ ] Build the SEO route shape for `/watch/[slug]` and other landing pages using ISR with a daily or event-driven refresh schedule tied to the catalog update cadence.

**Acceptance criteria:** indexed pages answer a real search intent with accurate information; structured data matches visible content; share cards do not leak private state; duplicate/thin combinations remain out of the index.

### Phase 6 — Production launch, reliability, and growth
**Status: Not started.**
1. Select the production host and configure environments, secrets, deployment checks, rollback, database backup/restore, and monitoring. Configure `shrugr.ro.to` DNS and TLS only with the owner’s hosting/DNS access.
2. Run end-to-end checks for the solo and group paths, no-provider/no-match/all-seen cases, stale availability, external-link behavior, and mobile breakpoints.
3. Audit accessibility, security headers, endpoint validation/rate limiting, privacy disclosures, data retention, dependency health, and third-party/API terms.
4. Measure Core Web Vitals and bundle size. Keep the initial decision flow lightweight; defer nonessential media and animation, optimize images, and use server rendering/static generation where it benefits real pages.
5. Add operational visibility for ingestion failures, stale availability, broken links, recommendation errors, and room cleanup without logging sensitive user preference data unnecessarily.
6. Release incrementally, review user feedback and completion/abandonment signals, and prioritize fixes before expanding the catalog or SEO page inventory.
7. Set up the actual deployment stack for the confirmed free-tier path: Vercel for app hosting, Supabase free tier for Postgres/Realtime, TMDB API for catalog metadata, and local browser storage for lightweight preference persistence.
8. For the free-tier plan, prefer: Vercel Hobby plan (if available for personal projects), Supabase free project for Postgres + Realtime, and TMDB free API access within rate limits. Do not rely on paid services unless usage exceeds free quotas or the project is ready for production scale.

**Acceptance criteria:** production build and smoke tests pass; deployment and rollback are documented; domain and TLS resolve correctly; key user journeys work on mobile; monitoring surfaces data and service failures without exposing private session state.

## Recommendation behavior contract

1. Apply hard constraints before ranking: selected provider overlap, runtime window, and interruption-friendly threshold when enabled.
2. Apply mood, delivery style, and visual vibe as soft ranking signals, not strict hard filters. Let the user pick a no-match state if the recommendation is not strong enough, and preserve the no-silent-relaxation rule.
3. For a request with no candidates, show an empty state and let the user decide which constraint to change.
4. Exclude titles marked seen for the current session; if all eligible titles are exhausted, explain that and offer a reset or changed filters.
5. Derive reasons from actual film attributes and user selections. Keep curated affirmations editorially authored; do not generate claims unsupported by catalog tags.
6. Treat provider availability as unknown unless returned by a verified, permitted data source for the relevant territory.
7. Watch links are supported in the MVP as long as the data is current and accurate; the app should allow the user to enable or disable specific providers such as Netflix, Prime Video, Max, Paramount+, etc., and should not force a streaming result if the user has no valid provider match.

## Technical and operational decisions to settle

- TMDB is now the selected metadata and poster source; confirm usage terms, refresh cadence, and cache policy.
- Vercel is the selected frontend deployment host; Supabase is the selected Postgres + Realtime backend for rooms and catalog data.
- Daily catalog refresh is the target refresh interval; a smaller cache layer should keep traffic under TMDB and Supabase limits.
- Editorial tagging definitions and quality-review ownership remain to be finalized.
- Privacy/retention for analytics and group-room state remains to be finalized.
- Deployment target, domain/DNS ownership, release/rollback process, and free-tier limits remain to be implemented and verified.

## Local verification

From the project root:

- `npm install` — install dependencies.
- `npm run dev` — start the local app.
- `npm run build` — compile the production app.

The current prototype still runs without a database or external production service. The next milestone requires provisioning Vercel + Supabase services and a TMDB API key, but the local prototype remains usable without those live integrations.

## Hosting & Deployment Specifications

- Primary hosting platform: Vercel
- Why: Native Next.js App Router hosting, global edge deployment, built-in preview environments, and serverless API support.
- Build strategy: Hybrid rendering using SSR for dynamic session flows and ISR for programmatic SEO pages such as `/watch/[slug]` so TTFB stays low globally.
- Database and realtime backend: Supabase
- Why: Managed PostgreSQL with Realtime WebSocket support for room sync and catalog persistence.
- Media and asset delivery: Vercel Edge Network / TMDB CDN
- Movie posters and backdrop assets: served directly via TMDB’s CDN.
- Dynamic OG images: rendered on the fly using Vercel `@vercel/og` edge functions for social sharing previews.
- Client persistence: browser `localStorage` for lightweight session recovery, provider selections, and recent watch state to reduce unnecessary reads.

## Free-tier setup plan

The project can be set up in a realistic free-tier path without paying upfront:

- Vercel: use the free hobby/personal plan for the app and preview deployments if available for this project.
- Supabase: use the free tier for Postgres, storage, and Realtime. Keep the schema minimal and the room state lightweight.
- TMDB: use the free API tier within its rate limits; cache results daily to avoid abuse and unnecessary calls.
- Local browser storage: keep user preferences and recent state local to reduce database reads and keep the app fast.
- Design principle: use the free tier for initial launch, then upgrade only when project scale, room usage, or API volume require it.

This is the recommended starting stack and should be treated as the launch configuration once the catalog and room system are ready for product use.

TMDB catalog ingestion
Supabase schema
provider availability sync
watch-link filtering
room-mode data model