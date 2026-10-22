# Shrugr Implementation Plan

**Product:** Shrugr — a context-aware movie picker  
**Production domain:** `shrugr.de5.net`  
**Status date:** 2026-10-22  
**Plan status:** Local foundation, the core solo flow, the soft-preference recommendation contract, and basic SEO scaffolding are implemented. MVP includes TMDB integration, automated catalog imports, a managed catalog with editorial admin tools, and programmatic SEO with expanded structured data and dynamic share cards. Supabase is selected for the managed catalog; project provisioning and app integration remain pending. Multi-device group rooms are deferred.

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
- Decision lock-in: mood, delivery, and visual inputs are soft ranking signals rather than strict hard filters. TMDB metadata integration is an MVP requirement; live provider availability remains deferred, so sample provider labels stay illustrative.

### Known prototype limitations
- Catalog entries, tags, and ranking are local sample data; they are not an editorially reviewed production catalog.
- Provider availability and watch destinations are illustrative. There is no live provider lookup or verified deep linking, and some UI copy risks presenting the sample data as current.
- Current recommendation tests are a small baseline, not comprehensive scenario coverage. They do not yet verify no-provider behavior, all titles seen, repeated spins, or ranking among multiple eligible candidates.
- Some result copy still reads like provider availability is confirmed even though the action is only a demo; review this wording before release.
- Runtime band semantics need review: the displayed 90–120 minute option currently imposes a 120-minute ceiling but no 90-minute lower bound.
- Recommendation behavior is now aligned with the product contract: mood, delivery, and visual choices rank candidates without silently excluding valid films, while hard filters and no-match states remain visible and actionable.
- Backup choices are the next ranked results, not yet deliberately differentiated by alternate pacing/intent. Affirmation handling is partly curated but also has generic runtime fallbacks.
- A server-side TMDB seed importer and catalog-backed film/collection SEO routes are implemented. TMDB metadata imports successfully into the local JSON catalog. A privileged sync command now upserts refreshed TMDB metadata plus Shrugr-authored fields into Supabase; it requires a server-only Supabase Secret/service-role key that is not yet configured locally. The solo picker reads published database films with local fallback. Admin UI/auth and SEO-route database integration remain outstanding. Supabase Realtime, user accounts, analytics, and group sync remain outside MVP.
- A poster-only TMDB refresh command is available to update poster paths without replacing existing catalog metadata; it requires the same server-side TMDB token and serves images through TMDB's CDN rather than storing image files locally.
- The solo picker now makes a live TMDB discovery request per pick and ranks a bounded, randomized candidate batch using generic genre-derived mood/delivery/visual signals. It does not scan every TMDB title, and live results do not include verified streaming availability or editorial pause-safety claims.
- Confirm TMDB image/API attribution and usage terms before production. The app currently uses remote poster images.
- The domain is a target only: DNS, hosting, and deployment are not configured here.

## MVP scope ledger

### MVP: keep in launch scope

| Feature | Current status | MVP definition / remaining work |
|---|---|---|
| Solo movie-picker flow | Implemented | One person can complete the flow and get a recommendation without signing in. |
| Runtime and interruption preferences | Implemented; verify edge cases | Apply the chosen runtime window and pause-friendliness as hard constraints; correct the 90–120 minute boundary. |
| Mood, delivery, and optional visual vibe | Implemented; polish optional | Use these as soft ranking signals; style selection must remain skippable. |
| Recommendation and recovery | Implemented; expand tests | Show one pick, fit reasons and viewing note, basic alternatives, spin-again/seen-title skip, and a clear no-match/all-seen recovery. Purposefully differentiated backups are not required for MVP. |
| TMDB metadata integration and automated catalog imports | TMDB import verified; Supabase sync implemented, requires server-only key | Run `npm run catalog:import` to refresh local metadata, `npm run catalog:sync` to refresh and upsert films into Supabase, or `npm run catalog:posters:sync` for poster-only refresh plus Supabase sync. Production schedule and persistence depend on the selected backend/host. |
| Managed catalog and editorial admin tools | Supabase read connection established; catalog empty | Seed published records, then build protected review/editing. Configure administrator authentication/authorization before enabling write access. |
| Provider preferences and availability | Preferences implemented; live availability not implemented | Keep user preferences local. Integrate a permitted regional availability source only if available; identify freshness and unknown states clearly and do not claim unsupported availability. |
| Programmatic SEO, structured data, and dynamic share cards | Initial implementation added | Static film detail and curated collection routes, canonical metadata, Movie/ItemList JSON-LD, generated sitemap entries, and dynamic Open Graph images are in place; review content quality and production URLs after catalog data is populated. |
| Responsive and accessible experience | Partially implemented; required before launch | Validate mobile layout, keyboard and screen-reader use, contrast, reduced motion, and clear provider/demo wording. |
| Basic discoverability and release readiness | Partially implemented; launch checklist | Keep existing metadata, robots, and sitemap scaffolding. Verify content/image usage terms, production build, hosting, domain, and TLS before public launch. |

### Deferred: explicitly outside MVP

| Feature | Decision |
|---|---|
| Supabase specifically | Selected for MVP managed catalog persistence. Apply the prepared schema and build protected catalog/admin integration. Supabase Realtime remains deferred with multi-device rooms. |
| Live regional provider availability and verified deep links | Defer. Continue clear illustrative/demo labeling; do not claim current availability. |
| User accounts, cloud-synced preferences, or cross-device history | Defer; retain browser-local preferences. |
| Couch/group recommendations and multi-device rooms/Realtime | Defer; retain the coming-soon placeholder. |
| Analytics and feedback instrumentation | Defer until privacy approach and product questions are defined. |
| Advanced backup differentiation, expanded affirmation system, and extra motion polish | Defer unless needed to meet the MVP's usability and accessibility acceptance criteria. |

## Delivery roadmap

Checklist notation: `[x]` complete, `[~]` partially implemented, `[ ]` not yet complete.

### Phase 0 — Foundation and project verification
**Status: Complete for the local prototype.**
- [x] Create Next.js App Router + TypeScript + Tailwind project structure.
- [x] Add local sample catalog and responsive UI shell.
- [x] Add basic page metadata for `shrugr.de5.net`.
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
**Status: Partially implemented.** The repeatable TMDB import script and typed catalog merge are in place. The local metadata catalog is populated; the Supabase schema is applied and the solo picker read connection is verified, but no published films are seeded yet. Configure admin authentication and implement editorial tools. Live regional provider availability remains deferred unless a suitable permitted source is selected.
1. Confirm TMDB API access, rate-limit handling, attribution requirements, and caching policy. Keep credentials server-side and define an import/refresh cadence.
2. [x] Select Supabase and apply the initial catalog schema/RLS policies. Define environments, access controls, backups, and project ownership before launch.
3. Implement the production catalog model: TMDB ID and metadata; runtime/year/poster/backdrop; editorial delivery, density, interruption and pause-complexity tags; cinematography axes/quadrant; intent tags; curated viewing note; and source/provenance fields.
4. [~] The local TMDB importer is verified and a Supabase sync mode exists. Configure a server-only Supabase Secret key and run the sync; later extend to scheduled refresh after hosting selection. Keep API credentials server-side, validate external payloads, respect provider limits, and make imports idempotent.
5. Build a protected internal tagging/review workflow after selecting catalog persistence and administrator authentication. Seed a smaller quality-reviewed catalog first, then scale only when tagging definitions and review capacity are proven.
6. Add catalog checks for duplicate IDs, missing or contradictory tags, invalid runtimes, unsupported values, poster failures, and stale/broken destination links.
7. **Deferred:** Add localized availability snapshots with territory and checked-at timestamps only after selecting a permitted data source. Distinguish streaming, rent/buy, unknown, and stale states; show a watch CTA only when its destination is verified and permitted.
8. **Post-MVP:** Use verified, fresh regional provider data for availability filtering. Until then, keep provider labels explicitly illustrative and do not imply a title is currently streamable.

**Acceptance criteria:** catalog changes are auditable and repeatable; secrets never reach client bundles; editorial fields have documented definitions. If live availability is added later, it must be territory-specific and timestamped, and unknown or stale availability must not be presented as current.

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
**Status: Deferred beyond MVP.** Keep couch mode as a coming-soon placeholder. Both single-device couch mode and multi-device rooms are excluded from the initial MVP; revisit scope after validating the solo picker.
1. Ship single-device couch mode first. Let the group enter or agree on constraints without requiring accounts or multiple devices.
2. Aggregate hard constraints using the lowest common denominator: minimum runtime ceiling, intersection of selected services, and pause-friendly filtering when any participant expects interruptions. Explain empty intersections and let users explicitly change constraints.
3. Aggregate mood and delivery preferences as soft weights; select a compromise near the shared preference overlap rather than an extreme outlier. Present the rationale without claiming unanimous preference.
4. Validate couch mode before adding multi-device sync. Define the room lifecycle, host controls, participant inputs, join-code entropy/expiry, reconnect behavior, reset/reveal flow, and data retention.
5. **Post-MVP:** If multi-device rooms are prioritized, implement room creation/joining, participant completion, and host-triggered recommendations; Supabase Realtime is a candidate implementation, not an MVP dependency.
6. Add abuse controls, rate limits, room expiration/cleanup, and graceful handling of disconnects, late joiners, duplicate submissions, and insufficient participants.

**Acceptance criteria:** group hard constraints cannot be bypassed; empty overlap is actionable; participants can understand the compromise; rooms are private by design, expire predictably, and recover safely from disconnects.

### Phase 5 — Search, sharing, and programmatic SEO
**Status: Initial feature implementation added.** Static film/collection routes, canonical metadata, Movie/ItemList JSON-LD, generated sitemap entries, and dynamic OG images are implemented. Analytics remains deferred.
1. [x] Add a baseline `robots.txt` policy and `sitemap.xml` scaffold for the app shell.
2. [~] Initial manually reviewed collections and title pages are backed by the shared catalog module. Switch their source to the managed catalog after backend selection; do not generate every possible filter combination.
3. [ ] Add canonical URLs, metadata, sitemap, and index/noindex rules. Index only useful pages with accurate, maintained content; prevent thin, duplicate, or empty combinations from entering search.
4. [ ] Generate contextual landing routes only where catalog coverage supports distinct editorial value. Do not make provider-specific claims without verified availability data.
5. [x] Add initial Movie and ItemList JSON-LD corresponding to visible catalog pages; continue validation as catalog records change.
6. [x] Add dynamic Open Graph previews for film and curated collection routes. Private session state is not included in these URLs, metadata, or images.
7. **Deferred:** Track organic landing-page quality and search performance using privacy-conscious analytics.
8. [ ] Build the SEO route shape for `/watch/[slug]` and other landing pages using ISR with a daily or event-driven refresh schedule tied to the catalog update cadence.

**Acceptance criteria:** indexed pages answer a real search intent with accurate information; structured data matches visible content; share cards do not leak private state; duplicate/thin combinations remain out of the index.

### Phase 6 — Production launch, reliability, and growth
**Status: Not started.**
1. Select the production host and configure environments, deployment checks, rollback, and basic monitoring. Configure backups appropriate to the selected managed-catalog provider. Verify `shrugr.de5.net` DNS and TLS with the owner’s hosting/DNS access.
2. Run end-to-end checks for the solo path, no-provider/no-match/all-seen cases, illustrative provider messaging, and mobile breakpoints.
3. Audit accessibility, security headers, endpoint validation/rate limiting, privacy disclosures, data retention, dependency health, and third-party/API terms.
4. Measure Core Web Vitals and bundle size. Keep the initial decision flow lightweight; defer nonessential media and animation, optimize images, and use server rendering/static generation where it benefits real pages.
5. Add operational visibility for app, recommendation, and catalog-import errors without logging sensitive user preference data unnecessarily. Availability freshness and room cleanup monitoring are post-MVP concerns.
6. Release incrementally, review user feedback and completion/abandonment signals, and prioritize fixes before expanding the catalog or SEO page inventory.
7. Set up Vercel hosting, server-side TMDB credentials, the selected managed catalog backend, and local browser storage for lightweight preference persistence.
8. Confirm service tiers, quotas, and costs for the selected backend and TMDB usage; Supabase is still a choice to make, not a preselected provider.

**Acceptance criteria:** production build and smoke tests pass; deployment and rollback are documented; domain and TLS resolve correctly; key user journeys work on mobile; monitoring surfaces data and service failures without exposing private session state.

## Recommendation behavior contract

1. Apply hard constraints before ranking: selected provider overlap, runtime window, and interruption-friendly threshold when enabled.
2. Apply mood, delivery style, and visual vibe as soft ranking signals, not strict hard filters. Let the user pick a no-match state if the recommendation is not strong enough, and preserve the no-silent-relaxation rule.
3. For a request with no candidates, show an empty state and let the user decide which constraint to change.
4. Exclude titles marked seen for the current session; if all eligible titles are exhausted, explain that and offer a reset or changed filters.
5. Derive reasons from actual film attributes and user selections. Keep curated affirmations editorially authored; do not generate claims unsupported by catalog tags.
6. Treat provider availability as unknown unless returned by a verified, permitted data source for the relevant territory.
7. In the MVP, provider selections only match the illustrative sample catalog; do not present them as verified availability or promise watch links. Live regional provider filtering and verified destinations are post-MVP, subject to an approved data source.

## Technical and operational decisions to settle

- TMDB metadata integration and catalog refresh are MVP requirements; confirm current terms, attribution, rate limits, and caching before launch.
- Vercel is the selected frontend deployment host. Supabase/Postgres is selected for the managed catalog; the project, initial schema, and solo-picker read connection are in place. Catalog seeding, admin integration, and production hardening remain outstanding. The production domain is `shrugr.de5.net`.
- Supabase Realtime remains deferred with multi-device rooms.
- Editorial tagging definitions and quality-review ownership remain to be finalized.
- Privacy/retention for analytics and group-room state remains to be finalized.
- Deployment target, domain/DNS ownership, release/rollback process, and free-tier limits remain to be implemented and verified.

## Local verification

From the project root:

- `npm install` — install dependencies.
- `npm run dev` — start the local app.
- `npm run build` — compile the production app.

The prototype and static SEO pages can run without a database. The solo picker reads published films from Supabase when available and otherwise falls back to the bundled catalog. The current Supabase catalog is empty, so seed published records before expecting database content to appear. Admin and SEO routes are not yet connected.

## Hosting & Deployment Specifications

- Primary hosting platform: Vercel
- Why: Native Next.js App Router hosting, global edge deployment, built-in preview environments, and serverless API support.
- Build strategy: Hybrid rendering using SSR for dynamic session flows and ISR for programmatic SEO pages such as `/watch/[slug]` so TTFB stays low globally.
- Catalog persistence/backend: Supabase is selected; the read-only picker integration is established, while editorial admin tools remain to be built. Supabase Realtime for synchronized rooms is deferred.
- Media and asset delivery: Vercel Edge Network / TMDB CDN
- Movie posters and backdrop assets: served directly via TMDB’s CDN.
- Dynamic OG images: rendered on the fly using Vercel `@vercel/og` edge functions for social sharing previews.
- Client persistence: browser `localStorage` for lightweight session recovery, provider selections, and recent watch state to reduce unnecessary reads.

## Backend and post-MVP options

For MVP, Supabase is selected for managed catalog persistence. Provision the project and confirm current plan limits before setup. Realtime rooms remain post-MVP:

- Vercel: use the free hobby/personal plan for the app and preview deployments if available for this project.
- Supabase: use Postgres for catalog persistence/admin tooling; Realtime is only needed if synchronized rooms are approved later.
- TMDB: required for MVP metadata integration; confirm current access, rate limits, attribution, and caching rules.
- Local browser storage: keep user preferences and recent state local to reduce database reads and keep the app fast.
- Design principle: use the free tier for initial launch, then upgrade only when project scale, room usage, or API volume require it.

Post-MVP work includes verified provider availability, watch-link filtering, analytics, couch/group mode, and a room-mode data model.