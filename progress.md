# progress.md — Living Status
**What this is:** the single place a fresh session looks to know where the project stands. **Every working session ends by updating this file** — flip phase statuses and prepend a dated log entry. Keep it terse; detail belongs in the other docs.

## Status snapshot

| Phase (plan.md §13) | Status |
|---|---|
| Content & research docs (pre-project) | ✅ done |
| Planning & architecture docs | ✅ done (2026-07-17) |
| 0 — Setup (scaffold, tokens, deploy, copy guides) | 🟨 live at `quiz.parenteers.id`; Workers Builds connection pending |
| 1 — Data & i18n (transcribe .md → JSON, scoring + tests) | ✅ done (2026-07-18) |
| 2 — Core flow, zero polish | ✅ done (2026-07-18) |
| 3 — Gesture & WebGL foundations | ✅ gestures done (2026-07-30); WebGL half removed 2026-08-02 (plan §6) |
| 4 — Motion layer | ✅ done (2026-07-29) |
| 4.5 — Art-led interface realignment | ✅ superseded by Phase 5.5 |
| 5 — Share pipeline | 🟨 live domain + 16 OG shells deployed; physical share/unfurl sign-off pending |
| 5.5 — Brilliant-spec interface revision | 🟨 revised against the user's device review (2026-08-02); headless QA green; Samsung/Instagram re-check pending |
| 6 — QA hardening | ⬜ |
| 7 — Launch extras (optional) | 🟨 sound layer shipped early (2026-08-02); analytics, founder-note flag and Awwwards assets remain |

## Next action

The landing-art visibility hotfix is now live (deployed 2026-08-16). Hard-refresh on the Samsung
and repeat the exact Chrome check that produced the blank cream band. The fix makes the primary
illustration visible independently of the GSAP entrance timeline, so early `deviceorientation`
events can no longer strand it at `opacity: 0`.

Also new in production and unverified on a real device: the rebuilt shareable result card, the
preloader bowl clip, and the redesigned desktop gate. On a phone, watch the preloader specifically
on a cold, throttled load: it is still a 1.8 MB clip for a surface that is on screen for about a
second, and how quickly the first frame lands is the whole question. On a desktop, the gate's four
`gate.*` strings are placeholders and need a copy pass.

Nothing in these releases is committed to git yet.

Re-run the interface on the Samsung A55/S25 FE and in the Instagram in-app browser, now that the seven screenshot notes are closed. Look specifically at: the question headline sitting over the faded illustration at each of the three size tiers (Q1 / Q2 / Q5), whether the indicator row now reads in daylight, the bigger baking marquee and its 5-second auto-advance, the quick-changing "other bakes" row on the result, and the ID/EN + sound toggles at arm's length. Then run the live WhatsApp unfurl check against the deployed 16 OG shells at `https://quiz.parenteers.id/r/{slug}`.

Two decisions the `/end` removal left open: the "Follow @parenteers" CTA and the made-by/copyright footer had no other home and are currently gone, and `config.flags.founderNote` is an unwired flag. If any of the three should live on the Result, say where.

Then listen to the sound layer on a real device with the Instagram in-app browser: confirm the bed sits under the cues rather than fighting them (tune `MUSIC_BED_GAIN`, currently 0.22, and the per-voice peaks in `core/audio.ts` — not the file), that the iOS silent switch behaves as expected, and that the theme retires cleanly at the Result so a screen recording of the share moment stays quiet.

One decision is waiting on the user: the final copy pass (`landing.eyebrow` and `quiz.cta_pick` ship as marked placeholders). The WebGL question is settled — that layer was measured and removed on 2026-08-02 (plan §6).

Worth adding to the device matrix: a **Samsung A23** (Snapdragon 680 class). The throttled proxy says the app should run there comfortably — peak heap ~12 MB, 60fps to 6× CPU throttle, 51fps at 8× — but GPU cost and memory bandwidth have never been measured on real budget silicon.

## Waiting on user (plan.md §15)

- [x] New active 16-character set delivered in `images/Pastries-personalities/`: all expected 1254×1254 opaque files are ordered by the type registry and now have intentional full-bleed 900×900 WebP derivatives in `public/characters/`
- [x] Six 941×1672 interface references and four 941×1672 opening variants inventoried and ordered in `images/README.md` (2026-07-29)
- [x] Active support path settled: optimized 404 WebP ships; the 10-second 1.76 MB `Preloader2.mp4` remains reference-only and the production preloader is lighter DOM/CSS/GSAP
- [x] No active `asset-pattern.png` exists outside `images/old images/`; Phase 4 intentionally retains the existing CSS/grain treatment
- [x] Both beds encoded by the user and shipped: `public/audio/ayo-main-bersama-asik.m4a` (3.67 MB, 152.62s) and `ayo-main-bersama-asik-result.m4a` (3.57 MB, 147.38s), AAC at ~200 kbps — both verified playing in-browser with no media error. Two optional refinements remain the user's call for **both** files: 96 kbps would roughly halve them with no audible loss on a phone bed under UI, and neither is `+faststart` (`moov` sits after `mdat`), so playback waits on more buffering than it needs to.
- [x] Parenteers product destination set to `https://parenteers.id/`; Indonesian Result cards and CTA use it (2026-08-15)
- [ ] Desktop gate copy, opened 2026-08-16: `gate.scan_title`, `gate.scan_hint`, `gate.reason` and `gate.continue_anyway` were written for the layout, not transcribed, because the gate has no page in `quiz-01-flow-dialogue.md`. All four need a copy pass in both languages
- [ ] Desktop gate illustration, opened 2026-08-16: the asset set has no landscape opening art, so the two-column gate is typographic. A wide illustration would let it carry a hero image
- [ ] Preloader clip weight, opened 2026-08-16: `public/motion/preloader.mp4` is 1.8 MB for 10s of animation plus a 244 KB silent audio track, where the preloader is only on screen for about a second. Trimming to ~3s and stripping audio would land under 600 KB but needs ffmpeg, which this project does not carry
- [ ] Two result-card copy/data calls opened 2026-08-16: the EN wording of `share.card_cta` ships as a placeholder ("Want yours too? Head to"), and `config.links.instagram` resolves to `@parenteers` while the design artwork shows `parenteers.id`
- [x] Final domain — `https://quiz.parenteers.id/` deployed 2026-08-16
- [ ] Cloudflare Workers Builds connection — required to close Phase 0 (Wrangler authentication confirmed 2026-08-16; GitHub remote is ready)
- [x] Official Parenteers palette, logo set, and favicon delivered and applied (2026-07-18); existing fonts retained because the brand pack contains no typography specification
- [ ] Any overrides to plan.md §14 decision defaults

## Session log (newest first)

**2026-08-16, Desktop gate deployed.**
Worker version `3bcf963d-e096-4e78-9d77-eb31ca79e88e`; 20 files uploaded, 128 already present, live
on both the workers.dev endpoint and `quiz.parenteers.id`. Production verification with a cleared
cache at three viewports: 1440x900 and 1366x768 both put the scan panel right of the copy with the
portrait art hidden and **0** vertical overflow; 820x900 stacks with the QR above the copy and the
art shown. All three expose the accessible QR name, the typeable host, three fact pills and the
escape hatch, with no runtime errors. The gate's host now reads `quiz.parenteers.id` rather than a
dev address, and since `createQrSvg` and `displayShareHost` are handed the same `quizUrl`, that
text confirms what the code encodes.

**2026-08-16, Desktop gate redesigned: copy left, QR right.**
The old gate was a `flow` stack with two-column rules bolted on at two different breakpoints via
`grid-column` / `grid-row` line hacks, inside a card capped at `--copy-max-width`. The column was
too narrow to hold the longest word, so the headline hyphenated as "Parentin / g Kamu", the QR
floated mid-copy, and the page scrolled on every desktop size. Rebuilt around explicit markup:
`.gate__card > .gate__main > [.gate__copy, .gate__scan]`, one breakpoint at `56.25rem`, and three
stale override blocks deleted. Left column is eyebrow chip, headline, lead, three fact pills, the
reason line and the escape hatch; right column is a warm panel with the scan title, the QR, the
typeable host and a camera hint. The QR tile is `--brand-canvas`, exactly `QR_CANVAS` in
`core/qr.ts`, so the code and its quiet zone are one surface. The duplicate in-card wordmark is
gone, since the page header already carries it and the language toggle.
The portrait artwork is now hidden while two columns are in play: `/opening/var-1.webp` is 540x960
and a full-width band across a wide card is about a 10% horizontal slice that decapitates the
characters. Tested at 11/14/9rem heights and 62/64/66% positions before concluding it, rather than
assuming. It returns below the breakpoint at a proper 4:3 crop, where the card stacks and
`.gate__scan` takes `order: -1` so the QR leads. Added a `max-height: 53rem` tightening block so a
hand-off screen never becomes a scroll.
Four new `gate.*` strings were written for the layout, since the gate has no page in
`quiz-01-flow-dialogue.md`; **all four are placeholders awaiting a copy pass** and are marked as
such in the source table and the required-key list. Added a desktop section to `qa:phase55`, the
first coverage this surface has ever had: it leaves phone emulation for three passes and asserts
column order, start-aligned copy, the hidden portrait art, the QR's accessible name, the typeable
host, three fact pills, the escape hatch, and overflow. Verification: **14 test files / 168
tests**, typecheck, and `qa:phase55` in normal and reduced motion (**0 failures / 0 runtime
errors**), with 1440x900, 1366x768, 1280x800 and 1440x720 all at zero vertical overflow. Both
languages were inspected, and the continue-anyway path still hands over to the framed phone.

**2026-08-16, Deployed to Cloudflare Workers.**
Ardy asked for the push. Release gate reported ready, **14 test files / 168 tests** passed, and the
dry run read **179 assets** with no bindings. Deployed Worker version
`1cee07ed-bd9c-4663-8960-e6173df7efe1`; Cloudflare uploaded 21 changed files (127 already present)
and activated both the workers.dev endpoint and `quiz.parenteers.id`. This release carries three
things that had not been live: the rebuilt shareable result card, the preloader bowl clip, and the
Samsung landing-art race fix that had been verified locally on 2026-08-16 but never deployed.
Production verification: `/`, `/q/7`, `/r/pgde/` and `/motion/preloader.mp4` all HTTP 200; the live
clip serves `ftyp` then `moov` at byte 36, so faststart survived the upload; a cold load of the
production URL showed the preloader as a playing, muted `<video>` with `mix-blend-mode: normal` and
no shadow; the Result rendered The Pretzel with zero horizontal overflow and no runtime errors; the
share card composed from the deployed bundle matches the design; and four sampled `/r/{slug}/`
routes expose absolute `og:url` and `og:image` values whose images return 200. Deployed from a dirty
working tree, so nothing in this release is committed yet. Physical Samsung/Instagram QA and a real
WhatsApp unfurl remain separate sign-offs, and Workers Builds Git integration is still not connected.

**2026-08-16, Preloader switched to the bowl clip and made seamless.**
Two asks: the preloader artwork should read as part of the page rather than a card with a drop
shadow, and the supplied MP4 should be tried in place of the still. The card look had one cause,
`mix-blend-mode: multiply` on `.experience-preloader__art`: multiplying the artwork's cream against
the page cream is exactly what drew a darker rectangle. That is gone, along with any border,
radius or shadow. `Preloader.mp4` does not exist; the only clip in `images/web-component/` is
`Preloader2.mp4`, which is what was used. It is a stirring mixing bowl, 500x500, 10.008s, on
textured paper about `#F5EDE1`, a shade deeper than `--color-editorial-canvas`, so its rectangle
cannot be colour-matched away. A new `.experience-preloader__stage::after` radial wash dissolves
the edge instead; measured around the whole perimeter of the composited box, the edge now differs
from the page by **0**. The wash is painted over the video rather than applied as a `mask-image`
on it, so it does not depend on how an engine composites video layers.
The master ships through a new `npm run assets:preloader`: its `moov` atom sat after `mdat`, so no
frame could decode until all 1.8 MB had arrived, which for a preloader is worse than no clip at
all. The script relocates `moov` and rewrites the chunk offset tables without re-encoding; the
derivative was verified pixel-identical to the master at four sample frames and now exposes `moov`
at byte 36. The preloader never waits on it: the first-frame gate is capped at 900ms and never
rejects, and on exit the element is paused and its `src` cleared so in-flight range requests are
cancelled. Reduced motion holds the first frame instead of stirring. `sceneArt.continuity.preloader`
is now validated as a root-relative MP4 while the other four continuity paths keep the WebP rule,
and the strict audit checks the clip's weight and atom order. Extended `qa:phase55` with a
preloader contract covering the element type, the muted/playsinline/aria-hidden attributes, the
absence of blend mode, border, radius and shadow, the presence of the wash, and the measured seam.
Verification: **14 test files / 168 tests**, typecheck, production build (**105.99 KB JS / 14.87 KB
CSS gzip**), strict asset audit (**0 issues**, clip reported faststart at 1808 KB), and
`qa:phase55` in normal and reduced motion (**0 failures / 0 runtime errors**).
Left open for the user: the clip is still **1.8 MB for 10 seconds of animation when the preloader
is on screen for about one**, and it still carries a 244 KB AAC track that nothing plays. Trimming
to roughly 3 seconds and dropping the audio would take it under 600 KB, but that needs a real
encoder (ffmpeg), which this project does not carry. An animated WebP was measured as an
alternative and rejected: 3 seconds at 400px/15fps already cost 816 KB.

**2026-08-16, Shareable result card rebuilt against `images/Result Card.jpg`.**
The user supplied a 390×768 result-card design and asked for it to become the result layout;
after checking, the surface it actually describes is the saved/posted card, not the in-app hero
(its footer invitation only makes sense to someone who did not run the quiz), and the user
confirmed that reading. `drawStoryCard` was rewritten from a nine-block editorial poster into the
supplied composition: centred wordmark, full-width character square, tracked eyebrow, Fraunces
name, `#F3E3CA` code pill with tracked orange letters, the tagline wrapping to at most three
lines, and a two-block footer. The superpowers list, watch-out paragraph, disclaimer and the two
decorative accent blobs are gone, and `ShareCardLabels` narrowed from four fields to
`{ intro, cta }`. Because the design is authored at a taller aspect than the 9:16 export, the
whole layout is scaled uniformly to the card's height and centred rather than stretched, so the
character square is 975px inside 1080; the WebPs carry the same cream as the canvas, so the
columns only show where a character's ink touches its own frame edge. Tracking is drawn glyph by
glyph, since canvas `letterSpacing` is not available on every WebView that offers
`navigator.share`. Added `share.card_cta` (ID transcribed from the artwork, **EN is a placeholder
awaiting a copy pass**) to both i18n files, the source table, and the required-key list. Extended
`qa:phase55` with a pixel-readback contract on the composed card: size, six ink bands measured
back in the artwork's own 390×768 units, pill fill, tagline block, and zero name ink over the
pill. Verification: **14 test files / 168 tests**, typecheck, production build (**105.76 KB JS /
14.82 KB CSS gzip**), strict asset audit (**0 issues**), and `qa:phase55` in normal and reduced
motion (**0 failures / 0 runtime errors**). All 16 types were rendered in both languages and
measured: every band lands within a reference unit or two of the design, no name reaches the code
pill, and no tagline reaches the footer. Two data mismatches are the user's call, not bugs: the
artwork's footer handle reads `parenteers.id` while `config.links.instagram` yields
`@parenteers`, and the artwork's three-line tagline is longer than any `types.json` `tagline`
field, so real cards wrap to one or two lines.

**2026-08-16, Samsung landing-art race fixed locally; production deployment awaiting approval.**
The supplied Samsung Chrome screenshot confirmed that the landing art band had its expected height
but the illustration itself was invisible. The device-only trigger was a GSAP ownership collision:
the landing figure participated in an `autoAlpha` entrance tween while early pointer/gyro handlers
targeted the same node with `overwrite: true`; a real phone can emit `deviceorientation` during mount
and interrupt the entrance while the figure is still hidden. The hero artwork no longer depends on
an opacity entrance, and the sensor tweens now use property-scoped `overwrite: 'auto'`. Extended
`qa:phase55` so it injects an early synthetic sensor tilt and treats sub-opaque landing art as a
contract failure. Verification passes: **14 test files / 168 tests**, typecheck, release build
(**105.32 KB JS / 14.82 KB CSS gzip**), and normal plus reduced-motion QA at 390x844 with **0
failures / 0 runtime errors**; the landing file loaded at
540x960 and rendered `opacity: 1`, `visibility: visible`. No cloud deployment was made.

**2026-08-16, Production opening-image report triaged; exact failing surface still needed.**
Investigated the report that the image around “Mulai Quiz” did not appear. The live Custom Domain
served the landing artwork and the Quiz Opening illustration successfully in the in-app browser at
390×844, 390×720, and a constrained 390×600 viewport. The opening image resolved to
`/art/scenes/q03-daily-schedule.webp`, completed eagerly at its native 720×480 dimensions, rendered
at opacity 1, and produced no console warnings or errors; the public asset and route both returned
HTTP 200. No speculative code or production deployment was made. A screenshot plus confirmation of
whether the missing image is the large “Mulai Quiz” artwork or the following clock/schedule artwork
is required to isolate a device/cache-specific failure.

**2026-08-16, Production deployed at quiz.parenteers.id.**
Set `config.links.site` to `https://quiz.parenteers.id/` and declared the hostname as a Wrangler
Custom Domain, with the Worker as origin and Cloudflare-managed DNS/TLS. Updated the release-readiness
tests so the current bundle must have zero launch warnings while a synthetic `TBD` fixture still
proves the warning and release-blocking guard. Release verification passes: **14 test files / 168
tests**, strict typecheck, production build (**105.31 KB JS / 14.82 KB CSS gzip**), and a 177-asset
Wrangler dry run. Deployed Worker version `fe286e6b-52d6-4002-bb29-aa8bda1140ab`; Cloudflare uploaded
146 changed assets and activated both the workers.dev endpoint and `quiz.parenteers.id`. Public DNS,
TLS, `/`, `/q/7`, and `/r/pcte/` returned HTTP 200. All 16 live result routes expose the expected
absolute `og:url` and `og:image` values with zero failures. Physical Samsung/Instagram QA and a real
WhatsApp unfurl remain separate launch sign-offs; Workers Builds Git integration is still pending.

**2026-08-16, Cloudflare Workers production build validated locally.**
Confirmed the existing assets-only Workers architecture against current Cloudflare SPA and Workers
Builds documentation plus the installed Wrangler 4.112.0 schema. Disabled Wrangler usage metrics and
dependency instrumentation at project level, so both local CLI runs and Workers Builds inherit the
no-telemetry policy. Verification passes: **14 test files / 168 tests**, typecheck, production Vite
build (**105.31 KB JS / 14.82 KB CSS gzip**), 16 prerendered Result routes, and a Wrangler dry run
reading **177 assets** with no bindings. The local Workers runtime returned HTTP 200 for `/`,
`/r/pcte/`, `/q/7`, and SPA fallback navigation. Wrangler authentication is current; the intentional
release guard still blocks deployment until `config.links.site` replaces `TBD`, after which the
Workers Builds connection and live deploy remain the only Phase 0 cloud steps.

**2026-08-16, Gallery edge spacing and weekly-action separation finalized.**
Added a measured 17px horizontal inset to the two-row Gallery rail and its action buttons, replacing
the flush card/button edges without changing card geometry. Moved `Coba minggu ini` out of the
full-width blue parent-support block into its own cream-canvas Result section; its heading and body
copy are blue, while its outlined number markers are orange. Updated the Phase 5.5 contract and QA
to lock the sibling order, colors, 17px Gallery insets, and zero overflow. Verification: **14 test
files / 168 tests**, typecheck, normal plus reduced-motion browser QA at 390x844 (**0 failures / 0
runtime errors**), and visual screenshot review. Per user direction, the production build was not run;
this pass finalizes UI first.

**2026-08-16, Superpower transition simplified.**
Changed the three Superpower number circles from blue to orange and removed the horizontal rule
between the blue parent-support block and `Superpower kamu`. Screenshot QA was intentionally skipped
per user instruction.

**2026-08-16, Divider before the parent-care inset removed.**
Removed only the horizontal rule after `guiltRelease`, directly before the translucent `careForYou`
inset. Other support dividers remain unchanged. Screenshot QA was intentionally skipped per user
instruction.

**2026-08-16, Parent-support conclusion moved into one blue reflection block.**
Turned `Yang perlu kamu ingat` and `Coba minggu ini` into one full-width brand-blue section with
white headings, body copy, dividers, and weekly-action markers. Orange remains only on the four
takeaway numbers. Replaced the former cream parent-care card with a translucent-white inset, and
added a white inset outline to the fixed save CTA so it stays legible over the blue section. Extended
browser QA with exact 390px width, background, text-color, parent-care surface, and save-label
visibility assertions. Verification: **14 test files / 168 tests**, typecheck, production build
(**105.29 KB JS / 14.81 KB CSS gzip**), and normal plus reduced-motion browser QA at 390x844 (**0
failures / 0 runtime errors**). The support screenshot was visually inspected.

**2026-08-16, Save-result CTA moved to the first meaningful scroll.**
Removed the story-completion gate from the Result share dock. The CTA now enters after 28% of the
viewport has been scrolled, about 236px at 390x844, and retreats only within 12% of the top. The
180ms dwell remains, so small accidental movement does not flash the control. QA now performs an
explicit 280px first scroll and requires the CTA to stay available through the story and parent
support. Verification: **14 test files / 168 tests**, typecheck, production build (**105.29 KB JS /
14.72 KB CSS gzip**), and normal plus reduced-motion browser QA at 390x844 (**0 failures / 0 runtime
errors**). The first-scroll screenshot was visually inspected.

**2026-08-16, Sensory-play extension parked and removed from runtime.**
Ardy and his wife will continue developing the core product before adding a sensory-play bridge.
Removed the experimental `Bayangan & Senter` Result section, bundled JSON, TypeScript contract,
runtime validation, tests, asset audit, QA capture and assertions, CSS, generated image, source copy,
and asset-processing command. Restored the share-dock boundary to the parent-support section. Saved
the product rationale, content direction, proposed future data contract, safety guardrails, and
reactivation criteria in `docs/future-sensory-play-result-extension.md`. The external 30-recipe
booklet remains untouched at its original location. Verification: **14 test files / 168 tests**,
typecheck, production build (**105.30 KB JS / 14.72 KB CSS gzip**), strict asset audit (**0
issues**), and normal plus reduced-motion browser QA at 390×844 (**0 failures / 0 runtime
errors**).

**2026-08-15, Parent-first storytelling implemented in the Result UI.**
Rendered each personality's bilingual `parentStory` directly below the Result hero, with four
editorial paragraphs and the matching full-bleed 3:2 illustration inserted after paragraph two.
Added the concise `parentSupport` layer beneath it in the required order: daily reality, guilt
release, parent care, child connection, then three weekly actions. The parent-care point receives
the only warm-card emphasis, so the visual hierarchy follows the content promise instead of making
every point compete. Added seven transcribed ID/EN labels, runtime validation, and data-integrity
coverage. Delayed the fixed save CTA until the complete story and parent-first summary have scrolled
away, preventing the dock from covering long-form copy. Extended `qa:phase55` with DOM-order,
mid-story image, localized alt, 390px full-bleed width, support-order, action-count, no-overflow, and
no-dock-during-reading assertions plus dedicated story/support captures. Verification: **14 test
files / 168 tests**, typecheck, production build (**105.30 KB JS / 14.72 KB CSS gzip**), and normal
plus reduced-motion browser QA at 390x844 (**0 failures / 0 runtime errors**). Story and support
screenshots were visually inspected; physical Samsung and Instagram in-app-browser review remains.

**2026-08-15, Sixteen mid-story personality illustrations added; copy made more human.**
Generated one 3:2 daily-life illustration for every bake personality, using the active character
art as the identity and watercolor-style reference. Preserved the 1536x1024 PNG sources in
`images/story-illustrations/` and added the repeatable `assets:stories` pipeline for 1200x800 WebPs
under `public/story-illustrations/`. Extended `parentStory` with `image`, bilingual `imageAlt`, and
the explicit `imageAfterParagraph: 2` presentation contract; runtime validation and integrity tests
now enforce the path, alt copy, placement value, format, and dimensions. Removed every em dash from
`types.json` and the editorial document, then replaced the repeated "The X dalam dirimu" phrasing
with conversational parent language. Added a repeatable `content:parent-doc` sync for the local
research/editorial note. Updated the existing Google Doc in place, renamed it with a comma, and
inserted sixteen centered PNG figures without rebuilding its native headings, bullet lists, safety
note, or source links. Connector readback verified 16 type headings, 16 inline objects, one image
after exactly two story paragraphs for every type, 116 native list items, and zero em dashes. PDF
export visual QA could not run because Drive returned 403, so page-level crop and pagination remain
unverified. Verification: **14 test files / 168 tests**, typecheck, and production build
(**104.62 KB JS / 14.22 KB CSS gzip**).

**2026-08-15 — All 16 parent-first results moved to story-first presentation.**
Researched daily parenting hassles, ordinary quality moments, Indonesia-specific screen guilt, and
narrative transportation/heterogeneity. Added a bilingual `parentStory` (`title` + four-or-more
paragraph `body`) to every `types.json` record. Each story uses a distinct daily-life scene, names
the parent's hidden load and guilt, gives the parent a pause or source of relief first, and only then
returns to connection with the child. The existing `parentSupport` fields remain as the concise
summary layer beneath the story. Updated the TypeScript contract, runtime validation, integrity
tests, `data-spec.md`, the research/editorial document, performance actual, and the Obsidian SSOT.
Rebuilt the existing Google Doc in place as story → conclusion bullets → three weekly actions for
all 16 types; connector readback verified one tab, all codes, 16 story headings, 16 conclusions,
16 action sections, 116 native bullets, and 13 working source links. The Result UI remains unchanged;
this pass fulfills the requested JSON + review-document content layer. Verification: **14 test files
/ 168 tests**, typecheck, and production build (**103.58 KB JS / 14.22 KB CSS gzip**).

**2026-08-15 — Parent-first depth added to all 16 personality records.**
Researched parental stress, guilt/shame, burnout as a risk-resource imbalance, caregiver
well-being, parent emotion regulation, and parent-child repair using official guidance and
peer-reviewed sources, including an Indonesian validation of the Parental Burnout Assessment.
Added a bilingual `parentSupport` object to every `types.json` record: `realLife`, `guiltRelease`,
`careForYou`, `forYourChild`, and three `tryThisWeek` actions. The sequence deliberately sees and
refills the parent before discussing the child; all 16 remain equal-love editorial interpretations,
not separately validated psychological diagnoses. Added TypeScript/schema validation, integrity
coverage, `docs/personality-parent-first-content.md`, doc-map entries, data-spec documentation, and
the Obsidian SSOT update. The Result UI is intentionally unchanged pending content review.
Created and read back the Google Doc “Parenting Bakes — Parent-First Personality Content (16
Types)”; all 16 codes, the safety boundary, native headings/lists, and eight source hyperlinks are
present. Verification: **14 test files / 168 tests**, typecheck, and production build (**90.59 KB
JS / 14.22 KB CSS gzip**).

**2026-08-15 — Localized Result products shipped; both music beds now loop.**
Replaced the former activity-tag soft sell with a language-specific product surface. Indonesian now
shows nine unique Parenteers products in a keyboard-focusable horizontal rail; the 400×400 WebPs are
exact copies from the companion `parenteers-landingpage` build, registered in `products.json`, and
every card plus CTA targets `https://parenteers.id/`. The landing page's
`stimulation-guide-large.webp` is correctly treated as a layout variant rather than a tenth product.
English renders no Indonesian product cards and instead shows “English-language products are coming
soon.” Both the quiz and Result streamed music beds now set `loop=true` at the engine boundary and
browser element factory. Updated the strict asset audit, data integrity tests, Phase 5.5 browser
contract, project docs, and Obsidian SSOT.
Verification: **14 test files / 152 tests**, typecheck, production build (**81.32 KB JS / 14.22 KB
CSS gzip**), strict audit (**9/9 product WebPs at 400×400; 0 issues**), and `qa:phase55` at 390×844
in normal and reduced motion (**0 failures / 0 runtime errors**). Chrome confirmed nine ID cards,
nine exact `https://parenteers.id/` links, zero broken product images, a scrollable rail, EN Coming
Soon with zero product cards, both active beds looping, and zero horizontal page overflow.

**2026-08-15 — Result save dock flattened.**
Removed the background and box shadow from the fixed wrapper behind the final “Simpan kartu hasil”
CTA, scoped only to the Result scene. After the user's correction, the button itself retains its
brand-blue background, white label, full accessible hit area, and save behavior. Added the wrapper's
transparent/no-shadow state and the button's retained brand color to the Phase 5.5 browser contract.
Verification: **143 tests**, typecheck, production build (**80.62 KB JS / 14.03 KB CSS gzip**),
and `qa:phase55` at 390×844 (**0 failures / 0 runtime errors**); computed styles confirm the
wrapper is transparent/shadowless while the CTA remains brand blue.

**2026-08-15 — Sound defaults on and starts at the first trusted interaction.**
The user asked for sound from the beginning or immediately after the first interaction. Mobile
autoplay policy still makes pre-gesture playback impossible, so the implemented contract is the
strongest reliable version: a fresh visitor starts with `sound: true`, the active bed buffers ahead,
and the first pointer or keyboard interaction anywhere unlocks playback without requiring a tap on
the sound toggle. A stored `pb1.sound=off` remains authoritative, the toggle stays reachable wherever
music can play, and Story remains silent. Updated the store tests, plan/conventions, Obsidian SSOT,
and `qa:phase55`; the browser contract now clears the stored preference, confirms the fresh toggle is
on and the theme is preloading, sends a trusted first pointer interaction, then requires the media
element to be playing with advancing `currentTime`.
Verification: **143 tests**, typecheck, production build (**80.62 KB JS / 14.03 KB CSS gzip**),
strict asset audit (**0 issues**), and `qa:phase55` in normal and reduced motion (**0 failures /
0 runtime errors**). In both browser runs the fresh state was `toggle=on`, `paused=true`,
`preload=auto` before input; after the first trusted pointer it was `paused=false`, `readyState=4`,
with `currentTime` advancing past 0.09s.

**2026-08-15 — Q10 regenerated as native landscape art; all questions share the Q1 3:2 contract.**
The user identified Q10's playground illustration as tiny on a short phone even though the runtime
file itself reported 720×480. The source was the outlier: Q10 was 1024×1536 portrait, and the
Phase 4 derivative pipeline's `fit: contain` shrank the whole portrait into a landscape canvas.
Normalized all twelve question sources to the Q1 contract, 1536×1024: Q4's one-pixel width drift
was corrected and Q6/Q9 were padded horizontally to preserve their complete compositions. The
first Q10 crop was correctly rejected by the user because it still read as portrait artwork forced
into a landscape frame. Q10 was then regenerated from a new landscape-first concept: a wide
side-view playground with the tall slide sweeping diagonally across the frame and two pastry
characters readable at phone size. Rebuilt the active 720×480 WebPs, added
`assets:normalize-question-art`, made the strict asset audit reject any non-1536×1024 question
source or unexpected runtime size, and made the normalizer reject portrait question art instead
of attempting another crop. Q10 remains in the 390×844 plus 390×720 Phase 5.5 QA pass.
Verification: **143 tests**, typecheck, production build (**80.58 KB JS / 14.03 KB CSS gzip**),
strict asset audit (**12/12 question sources 1536×1024; 12/12 derivatives 720×480; 0 issues**),
and `qa:phase55` in normal and reduced motion (**0 failures / 0 runtime errors**). The short Q10
capture kept the art at 390×260, CTA inside the 720px viewport, and horizontal overflow at zero.

**2026-08-02 — Art fade reinstated, scoped to the heights that actually need it.**
The user asked for the gradient back "just for the risk potential device, to make the image feel
one with the environment". Scoped by measurement rather than by guess: the image is a fixed 260px
starting just below the rail, so copy-on-art is purely a function of viewport height — 0px at 915
and 870, 30 at 844, 49 at 820, 66 at 800, 95 at 730, 151 at 667. At 844 and above the copy only
reaches the image's empty bottom margin, which is exactly why a full-height phone reads clean
unmasked. **820px is where it first reaches real picture**, so `@media (max-height: 51.25rem)`
reinstates the fade there (full to 50%, 45% at 72%, 14% at 88%, gone by 100%) and everything taller
keeps the plain z-ordered layer. Verified the switch flips at exactly 820: 821 unfaded with 15px of
overlap, 820 faded. `:root[data-presentation="framed"]` keeps the escape hatch unfaded for the same
reason it keeps the width-only type scale — the query measures the window, not the 390×844 frame —
confirmed at 700px and 620px windows. Honest limit recorded in the phase doc: below ~700px the
headline starts above the image's halfway mark and the fade cannot fully keep ahead of it; that is
below every device in the target matrix. `qa:phase55` now asserts *both* states — mask `none` on
all four sampled questions at 844, and a gradient in the 390×720 pass.

**Also this session: the dev server had died.** Port 5173 was unbound (a probe against it hung for
ten minutes before I checked, which is how it surfaced), so the phone could not have been loading
anything. Restarted via the `parenting-bakes` launch config and confirmed HTTP 200 on both
`127.0.0.1:5173` and `192.168.1.6:5173`.

**2026-08-02 — Display headlines sized as a percentage of the screen, not just its width.**
The user asked for the font size to be a percentage on smaller screens. The existing scale was
already percentage-based, but only of *width* (`cqi`) — which is exactly why it missed: an A55 with
browser chrome is the same 390 wide as the design canvas and ~120px shorter, so a width-only scale
handed it the identical 36px that overwhelmed it. Each display tier is now
`clamp(floor, min(Ncqi, Msvh), ceiling)`, both terms resolving to the same number on 390×844, so
the reference frames are untouched and the height half only bites below them. Floors dropped from
2/1.7/1.45rem to 1.4/1.25/1.1rem or they would have blocked the shrink they exist to bound. `svh`
rather than `dvh` on purpose: `dvh` would resize the headline every time the URL bar hides.
Rejected `cqb` (which would have been container-faithful and needed no guard) because it requires
`container-type: size`, and size containment makes those scenes a containing block for
`position: fixed` — that would break the exit dialog's non-modal fallback, which lives in the
question scene. Instead `:root[data-presentation="framed"]` pins the desktop escape hatch to the
width-only scale; verified it holds at 26px in a 620px-tall window, where `svh` would otherwise
have rendered ~19px and misreported the phone layout. Measured 8 screens × 5 prompts × both
languages: 36/30/26 on the canvas, 31.1/25.9/22.5 on an A55 with chrome, 33.7/28.1/24.3 on an
S25 FE with chrome, down to 23.9/20/17.6 at 390×560 — all 40 within three lines, CTA above the
fold, art at native size, no overflow. **Correction to the previous entry:** the 24-case clip
sweep it cited did not seed `pb1.answers`, so the route guard bounced every deep link to Q1 and it
only ever measured the shortest prompt; the 40-case run supersedes it and reaches all three tiers.
`qa:phase55` now asserts the 720px headline is strictly smaller than the 844px one.

**2026-08-02 — Question art switched from a gradient fade to a plain z-ordered layer.**
The user's call: they preferred the illustration to sit behind the copy as a background layer
rather than dissolve into it. `mask-image` on `.question__art` is now `none`. The layering was
already in place and does the whole job — the band is the scene's background at `z-index: 0`, the
stack paints over it at `1`, and `.scene__body`'s `isolation: isolate` scopes both to the scene so
they cannot fight the header or the toasts. Two things made the fade safe to drop: the image's own
canvas is `--color-editorial-canvas`, so its frame edge is already seamless against the page, and
the band is always taller than the 260px image, so `overflow: clip` never cuts it. Verified the
second point rather than assuming it — 24 cases from 390×560 to 412×700, both languages, the
longest prompts: **no hard clip, art never rescaled off its native 260, CTA above the fold every
time**. The `qa:phase55` question block now asserts the *stacking* (mask `none`, stack z-index
above the band, stack positioned, body isolated) instead of asserting a gradient. Known trade,
flagged to the user: on a short screen the headline now sits on full-strength artwork.

**2026-08-02 — S25 FE screenshot chased down: stale HMR stylesheet, not a live defect.**
The user sent an S25 FE capture of `/q/1` with the question scene split into two columns and the
headline breaking mid-word. Diagnosed rather than patched: the phone had the *new* muted-blue
indicator row but the *old* two-column collapse, and those two edits landed at different points in
the same session — the contrast fix early, `grid-column: 1` only after the first `qa:phase55` run
caught the collapse. A page that HMR-updated between them and then lost its websocket (screen
sleep) freezes in exactly that state. Confirmed the LAN server serves the fix (`grid-column: 1`
present in `motion.css` fetched from `192.168.1.6:5173`) and reproduced across ten phone viewports
— 360×640 through 480×900, including the S25 FE's 411×830 and 412×915 — where the stack is column
1 at full viewport width every time, with no overflow. No code change was needed; the fix is a
hard reload away. Two hardening changes went in anyway: `qa:phase55` now asserts
`.question__stack` is in `grid-column: 1` at full width so a regression reports the *cause*
("headline column collapsed") rather than the symptom (a cropped art band), and the baking
auto-advance assertion now polls instead of sampling at a fixed delay — the hold and the scene
transition are separate clocks, and a single read could land between them. Three consecutive
normal runs plus reduced motion: 0 failures, 0 runtime errors.

**2026-08-02 — Seven screenshot notes closed; the journey now ends on the result.**
The user reviewed the build on a Samsung A55 and an S25 FE and filed seven notes. The structural
one was the trimmed question artwork: centring the illustration in the *leftover* space only worked
at the 844px design canvas, and an A55 with browser chrome is **~720 CSS px**, where Q5's five-line
headline left the band **~40px of a 260px image**. The band is now `grid-row: 2 / 4` with
`align-content: start`, so the art keeps its full native 260 whatever the copy does and the copy
sits *over* its lower half behind a `mask-image` fade — which is also what the user asked for
("background still can be seen under the text"). Every band needed `grid-column: 1`: without it
the stack, whose row the band now occupies, auto-placed into an implicit second column and halved
the scene — caught by the QA contract, not by eye. Headlines step down by scenario length
(`data-scale` md/sm, >40 and >58 chars) so no prompt exceeds three lines; verified at 390×720 with
Q5 at three lines and the CTA at 661. On the header row the suggestion turned into a fix: the
design file draws `← Kembali`, the counter and the close control in `--color-outline`, **1.4:1**
against the cream page — a WCAG 1.4.3 failure that is why they were nearly invisible in the
screenshot; muted blue restores the quiet hierarchy at ~4.9:1. `/end` was removed entirely — scene,
route, guard, QR regex, `end.*` keys, `continuity.end`, CSS and tests — and Story's Close button
went with it, leaving "Balik ke hasilku". The result tail lost the Continue and See-all chips
(2-up now) and gained a fourth section at the same weight as the pop-culture cousin: three tiles
quick-changing through the other fifteen bakes (disjoint round-robin decks, one swap per 520ms,
driven only while on screen, all fifteen warmed on first start) over a full-width "Lihat semua 16
tipe". The ID/EN toggle had the exact oval defect already fixed on the sound toggle — `2px 4px`
padding left the thumb 28×30 and the labels 28×32 — now uniform `3px` for a square 28px row and
`50%` radii. The off-centre sound glyph was in the SVGs, not the CSS: a `contain` mask centres the
viewBox, not the drawing, and both icons sat 6–7 units right of centre; recentred to 31.84/32.0
with a shared speaker path so nothing shifts when the toggle flips. Baking handed its flexible row
to the marquee instead of the status lines, so thumbnails are **164px at 390×844** (up from 104,
or 68 on short screens) and scale with the viewport; the four cross-fading lines became one static
line picked per run (the cross-fade *was* the flashing); and the continue button became a 5s
`config.loading.holdMs` auto-advance, tap-to-skip, making it the only scene with no bottom band.
Verification: **143 tests** / 14 files, typecheck clean, build **80.58 KB JS gzip** (−0.94 with the
end scene gone) / 13.95 KB CSS, `qa:phase55` **0 failures / 0 runtime errors** in both motion modes
against a contract extended with the header-ring geometry, the `getBBox()` glyph centring, the
390×720 short-viewport pass, the marquee size and the baking auto-advance, asset audit 0 issues.
Physical Samsung and Instagram in-app-browser re-check still owed. Two things the user should know:
the `/end` removal also took the "Follow @parenteers" CTA and the made-by/copyright footer, which
had no other home, and `config.flags.founderNote` is now an unwired flag.

**2026-08-02 — Second bed added: the result reveal gets its own track.**
The user supplied `ayo-main-bersama-asik-result.m4a` (3.57 MB AAC, 147.38s) as the result audio. Generalized the engine from one music element to a per-track voice map: each track owns its own `<audio>`, `MediaElementAudioSourceNode` and `GainNode` into the master, so the handover is a genuine crossfade (outgoing bed ramps down and pauses on landing, incoming swells over 1.2s) rather than a shared bus fighting itself. `startMusic` now takes a `MusicTrack`, is idempotent for the track already playing — re-entering a question must not rewind the quiz bed — and `SCENE_MUSIC` in app.ts maps scenes to beds: `theme` for Landing/Opening/Q1–Q12/Calculating, `result` for the reveal, nothing elsewhere. Story stays deliberately silent so a screen recording of the share surface carries no music. `preload="none"` still means only the bed a scene actually asks for is fetched, and neither is touched while sound is off. Verified in-browser across the real routes: Landing plays `ayo-main-bersama-asik.m4a`; navigating to `/r/pgde` leaves it paused at 2.9s while `ayo-main-bersama-asik-result.m4a` runs; `/story` leaves both paused; no media errors and no runtime errors. Verification: **145 tests** (+2: crossfade and no-restart), typecheck clean, build 81.52 KB JS / 13.94 KB CSS gzip, `qa:phase55` 0 failures / 0 runtime errors, asset audit 0 issues, both beds present in `dist/audio/`.

**2026-08-02 — Sound toggle made a true circle; theme buffers ahead for returning visitors.**
Two user reports, both closed. The toggle was not a perfect circle because `box-sizing: border-box` (base.css) meant the 36px box minus its 1px border and `2px 4px` padding left a **26×30** content box, while the capsule was pinned at 28×32 — it overflowed and the 16px radius clamped into a vertical oval. Both rings are now sized to square content (`padding: 3px` → 28×28) with `border-radius: 50%`, so they can only describe circles, matching the icon family's own no-`<ellipse>` rule; measured 36×36 and 28×28 at 50%. The "audio gone after refresh" report is the browser autoplay policy and cannot be bypassed — a reload always requires a fresh gesture before sound may start. Verified with trusted CDP input that the existing first-gesture unlock does work: with sound persisted on, a tap **anywhere** (not just the toggle) resumes the theme, 0 → 1.98 → 4.01s. The test did expose a real weakness though: `preload="none"` held after reload, so `readyState` was 0 and that first tap paid for the 3.67 MB fetch as well as the start. `startMusic()` now promotes the element to `preload="auto"`, which leaves the default-off path at zero bytes but takes a returning visitor to `readyState` 4 before they touch anything — playback is now instant on the first tap. Also fixed the detached-`<audio>` defect from the previous entry. Verification: **143 tests**, typecheck clean, build 81.37 KB JS / 13.94 KB CSS gzip, `qa:phase55` 0 failures / 0 runtime errors, asset audit 0 issues.

**2026-08-02 — Theme wired in; sound toggle restyled onto the `language-selection` pattern.**
The user supplied their own encode (`audio/ayo-main-bersama-asik.m4a`, 3.67 MB AAC ~202 kbps, 152.62s) and reported the toggle looked foreign in the header. Copied the encode to `public/audio/` — the source folder is not served — and pointed `MUSIC_SOURCES` at the real filename rather than a generic `theme.*`. Rebuilt the toggle against the authoritative geometry in motion.css §`language-selection` instead of the invented white circle: it is now the same 36px-tall outline pill (`--color-outline` hairline, 18px radius, transparent ground, no shadow) wrapping a 28×32 capsule that fills `--brand-blue` exactly like the language thumb, with the glyph inverting to `--color-editorial-canvas`. The icon became a masked span rather than an `<img>` so one element can carry both states and invert against the fill; the two SVGs stay the runtime source of the mask. Measured both controls side by side: identical height, top, radius, border colour and fill. Also fixed a real defect the check surfaced — the `<audio>` element was created detached and never appended, which is unreliable for resource selection in in-app WebViews; it is now attached with a `data-app-music` marker and removed on `destroy()`, covered by a new assertion. Verified the theme actually plays: `currentSrc` resolves, `readyState` 4, `duration` 152.62 matching the master, no media error and no runtime errors. Verification: 142 tests, typecheck clean, build 81.36 KB JS / 13.93 KB CSS gzip, `qa:phase55` 0 failures / 0 runtime errors, asset audit 0 issues, and the theme ships to `dist/audio/`.

**2026-08-02 — Audio layer shipped: synthesized interaction cues + streamed theme, muted by default.**
The user supplied `audio/ayo-main-bersama-asik.wav` (27.94 MB, 48 kHz/16-bit **stereo**, **152.60s**, peak −3.3 dBFS, body RMS ≈ −19 dBFS, fades to digital silence with 1.503s of trailing pad, licensed) and asked for sound on every interaction. Two measurements set the architecture before any code: decoding that track would be **55.88 MB** of Float32 — roughly five times the app's whole heap and ~20× the GL drawing buffer removed earlier the same day — so it streams through `<audio preload="none">` + `createMediaElementSource`; and because no SFX files exist, the six one-shots (`press`/`select`/`swipe`/`boundary`/`confetti`/`reveal`) are **synthesized** from oscillators and one reused 0.35s noise buffer, tuned to a C-major pentatonic so they sit inside the theme. Added `core/audio.ts` (lazy context, gesture unlock, master/sfx/music buses, per-voice envelopes with `onended` teardown, 8s idle suspend, `visibilitychange` release, silent no-op on every failure path) and wired cues to the existing haptic sites: `bindPressFeedback`, `selectAnswer`, story panel/boundary/dismiss, the language drag commit, `runConfetti` and the result reveal. Restructured `bindPressFeedback` and `runConfetti`, which previously returned *before* their feedback under reduced motion — choreography degrades, feedback does not (conventions §1, now rule 6). Sound persists in the store as `pb1.sound`, **off by default** (plan §14 decision 5); the toggle deliberately sits outside `.app-header__language` because that container is `display: none` on Quiz Opening and Q1–Q12, which is exactly where the theme plays — burying it there would have failed WCAG 1.4.2. Added `sound-on/off.svg` to the icon family and three ID/EN strings through `quiz-02-ui-strings.md` → JSON → `REQUIRED_I18N_KEYS`. Measured rather than assumed: enabling sound costs **+0.04 MB heap**, and **+0.12 MB after 240 cues** — an unrealistically heavy burst; with sound off no `AudioContext` is ever constructed and the theme is never requested, so the default path is **0 bytes**. Verification: 14 test files / **142 tests** (129 → +11 audio engine, +2 store), typecheck clean, production build **81.33 KB JS gzip** (+2.49, no new dependency) and 13.85 KB CSS, `qa:phase55` **0 failures / 0 runtime errors**, asset audit 0 issues, `perf:probe` heap 6.7–7.63 MB across routes with a −0.85 MB leak check and Result holding ~50 fps at 8× CPU throttle, and a CDP oscillator count proving press (1) and confetti (5) fire identically in `no-preference` and `reduce`. Rendered and inspected the header at 390×844 on Landing (toggle + language pair, centres aligned at y=39) and mid-quiz (toggle alone, language correctly hidden). The theme derivative itself is still pending — see *Waiting on user*.

**2026-08-02 — Double-click Windows app-server launcher added.**
Added `Start App Server.bat` at the project root so the local review server can be started without entering commands. It resolves the project from the launcher's own path (including the folder's spaces and `#`), checks for the project and npm, uses fixed port `5173`, opens the app in the default browser, detects an already-running Parenting Bakes server, keeps startup failures visible, and reminds the user that the terminal window owns the server process. Verified both paths: the launcher started Vite successfully from a stopped state, its already-running check exited cleanly with code 0, and the app returned HTTP 200 on port 5173.

**2026-08-02 — WebGL world layer measured and removed; low-end device headroom quantified.**
The user asked whether the app would run on a Samsung A23 (below the A55), and separately whether the persistent `[data-world-canvas]` was needed at all. Both answered by measurement rather than reasoning. Added `scripts/perf-probe.mjs` (`npm run perf:probe`) for heap, decoded-image footprint, DOM/listener counts, throttled fps and a leak check, plus `scripts/perf-canvas-audit.mjs` (`npm run perf:canvas`) and `scripts/perf-canvas-map.mjs` which capture each route, hide the canvas, capture again and diff — all three documented in the new **`docs/performance-probes.md`** alongside the recorded baselines and the interpretation traps — with a control capture proving the scene was static, so the diff can only be the canvas. Result: pixel-identical on `result`/`story`/`end`, and the 0.4–1.5% differences on `intro`/`question`/`gallery` mapped exactly onto glyph edges, i.e. text flipping from subpixel to grayscale antialiasing because a composited layer disappeared — not canvas content. Phase 5.5's flat opaque surfaces had occluded it completely. Removed `src/gl/` (5 modules + 4 test files), the boot fps probe, the store's performance tier, the `[data-world-canvas]`/`[data-webgl]` CSS and the `--z-world` token, and dropped `three` + `@types/three` from the dependencies and lockfile; the answer-select haptic tick moved from the deleted world listener into `scenes/question.ts` beside its `burstAt` so the visual+haptic pairing (conventions §1) is preserved. Measured effect: JS **214.86 → 78.84 KB gzip** (raw 753.52 → 215.26 KB, so ~534 KB less to parse at boot), GL drawing buffer 2.83 MB → none, heap across the flow 11.95–17.32 → 9.32–12.04 MB, listeners on Result 416 → 275, and the Result page at 8× CPU throttle **40.4 fps with a 100 ms worst frame → 51 fps with a 33 ms worst frame**; the leak check went from +0.06 MB to −0.33 MB across a full 19-route run. Reconciled plan §6/§8/§10/§13, structure.md (two pillars instead of three, layer diagram, directory map, §8 marked historical, §11 clone recipe), conventions.md, CLAUDE.md/AGENTS.md and docs/design-tokens.md. Verification: typecheck clean, 13 test files / 129 tests (down from 17/151 with the gl suites), `qa:phase55` 0 failures and 0 runtime errors in both motion modes, asset audit 0 issues, production build 78.84 KB JS gzip. A23-class silicon is now recommended for the physical device matrix, since GPU and memory-bandwidth cost were never measured on real budget hardware.

**2026-08-02 — Phase 5.5 refined against the user's screenshot review.**
Seven follow-up notes, all closed. The bottom CTA was too tall because Phase 4.5 pinned `.button--primary { min-block-size: 3.7rem }` (59.2px) — not the `::after`, which was the user's hypothesis; it is now 52px, the spec's `pad(16,32)` around a 16/1.25 label, with the expression mark 2px from the label, unrotated, and deliberately shorter than the label's line box so it can never drive height again. Quiz Opening and Q1–Q12 art now sits in a dedicated art band that owns the leftover space and centres the illustration in it: the illustration renders at its native 390×260 at every viewport height and the band clips rather than the image rescaling. The baking status lines collapse into a single grid cell and cross-fade one at a time at 18px, centred in the space below the marquee, with reduced motion keeping the plain four-line list. On Result, one unbreakable word turned out to be breaking two things at once: "The Croquembouche" at 48px overflowed and, because the hero column was content-sized, dragged it to 439.8px — which is why the character illustration looked mis-cropped, it was 50px wider than the screen. Fixed with `grid-template-columns: minmax(0, 1fr)` plus a `data-long-name` step-down to 36px. The power/intro bullets were 42×27 pills because Phase 4.5's scene-scoped rule outranked the new one; both are now scene-scoped and pinned to the spec's 27px circle. The secondary result actions became a 2×2 tray of warm capsule chips with icons from the existing family and an elastic icon kick on press, and the soft-sell block was brought into the same warm language so the page tail reads as one family instead of blue outlines beside tan capsules. Extended `qa:phase55` to lock all of it — CTA height/gap/rotation, native art height and centring, one visible status line, character width, name containment, bullet geometry, and chip count. Verification: 0 failures and 0 runtime errors in both motion modes, typecheck clean, 17 test files / 151 tests, production build 214.86 KB JS gzip and 13.83 KB CSS gzip, asset audit 0 issues, and every revised surface visually re-inspected including the long-name `/r/pcte` case. Physical Samsung and Instagram in-app-browser approval still unclaimed.

**2026-08-01 — Phase 5.5 LAN review server restarted.**
Started the configured Vite development server on `0.0.0.0:5173` for the requested app review and verified HTTP 200 at both `http://127.0.0.1:5173/` and the current Wi-Fi address, `http://192.168.1.6:5173/`. The server is an ephemeral workstation process and must remain running while desktop, Samsung, or Instagram in-app-browser checks are in progress.

**2026-08-01 — Phase 5.5 interface revision implemented against the Brilliant design file.**
Connected the Brilliant connector and read the authoritative spec straight out of `Canvas.design` (design system `figma-parenting-personalities`, 7 frames + 18 components) rather than measuring the JPG exports, then rebuilt the interface on it. Corrected the spacing tokens on record: the real values are `universal-padding 34`, `header-to-body 16`, `component-spacing 12`, not the 35/14/16 the user proposed. The structural fix was putting `.app-header` back in flow and making every scene the spec's three-band grid (header 70/pad 17 · body fill · bottom section pad 0/34/34), with a definite runtime height on one-screen scenes via `:has()`; that single change fixed the drifting question CTA, gave the Result share bar somewhere to dock, and deleted the per-scene `padding-block-start` that was stealing 94px from the artwork on every screen. Named three root causes rather than patching symptoms: the trimmed headline was `.split-char-mask { overflow: hidden }` clipping at a `line-height: 0.95` content box; the misaligned progress digit was a rolling `inline-grid` window taking the number off the label baseline; the sliced Quiz Opening art was a 540×960 portrait forced into a landscape box, now a native 720×480 3:2 derivative in a full-bleed 3:2 band. Also shipped: `progress-bar-star.svg` and `button-expression.svg` as real runtime assets (the star was a `content: "✱"` glyph), `Button-blue` geometry on every bottom CTA, the 64×36 `language-selection` toggle hidden on Opening and Q1–Q12 per the frames, `Choice Capsules` styling with the answer-shifting "Ubah jawaban" link removed, a three-row shuffled character marquee replacing the baking dial-in-a-card at 204 KB via thumbnails, and an art-first Result with a scroll-driven docked share bar plus a restructured after-scroll block that keeps the soft-sell, disclaimer and every route entry point. Two defects only the screenshots caught: the scenes were 96% alpha so the art bands read as pasted-on rectangles (now flat and opaque — the ambient shader consequently only shows in Story), and `--color-editorial-canvas` was one red unit off what the WebP encoder actually writes, so the token now matches the encoder and the bands are mathematically seamless (the Story compositor and OG generator were aligned too). Fixed `--ease-spring` and `--ease-in-out`, referenced by the stylesheets but never declared, which had been silently invalidating those transitions. Added `scripts/qa-phase55.mjs` (`npm run qa:phase55`) which drives CDP Chrome at 390×844 with touch emulation and asserts the band contract, art ratios, rail, label and dock cycle per surface. Verification: 0 failures and 0 runtime errors in both `no-preference` and `reduce`, typecheck clean, 17 test files / 151 tests, production build 214.60 KB JS gzip and 13.58 KB CSS gzip (down from 14.35 after ~47 dead rules were stripped), strict asset audit 0 issues across 51 derivatives and 17 OG images, and the five revised routes visually inspected against `images/new-layout/`. Physical Samsung and Instagram in-app-browser approval remains unclaimed.

**2026-07-31 — Brilliant sample layout applied to the runtime.**
Recomposed Landing, Quiz Opening, Questions, and Result around the updated Brilliant samples while preserving the existing copy, scoring, persistence, and continuous Q1–Q12 behavior. All non-result illustrations now act as full-width environmental background layers; Result character art intentionally remains foreground content with `object-fit: contain`. Questions now use the sample's editorial toolbar, 12-step asterisk rail, flat answer cards, always-present disabled/enabled CTA, and helper placement. In-app-browser QA at 390×844 visually confirmed Landing, Opening, Q1, the intentionally unclipped Q2 packing composition, `/r/pgde`, answer-selection state, and reduced-motion Landing parity; Q2 spans exactly the viewport width with no broken assets or horizontal overflow, and the Pretzel remains a relative foreground image. Verification passes: typecheck, 17 test files / 151 tests, production build at 214.12 KB JS gzip, and strict asset audit with zero issues. Fresh Samsung and Instagram in-app-browser visual approval remains required before Phase 4.5 closes.

**2026-07-31 — Brilliant connected as the active Codex design workspace.**
Confirmed the Brilliant design connector is callable from this Codex project and initialized an isolated editable session on `Canvas.design`. The canvas is currently empty; no Figma nodes were silently imported and no runtime interface code changed. The next design step is to seed Brilliant from the implemented project tokens and explicitly selected app surfaces, while retaining the existing Figma board as a read-only historical handoff unless the user asks otherwise.

**2026-07-31 — Illustration backgrounds unified at `#FEF2E1`.**
Normalized the edge-connected cream canvas across all 34 requested source PNGs: four `opening-image` variants, 16 active `Pastries-personalities`, and 14 `scene-art` files including the two inactive checkpoint rollback sources. The deterministic pass preserves character details, watercolor contact shadows, and foreground texture while making the outer canvas exact `#FEF2E1`; it is repeatable through `npm run assets:recolor-backgrounds -- --apply`. Rebuilt all 51 Phase 4 WebP derivatives and 17 OG images, and aligned the editorial runtime, Story compositor, scene-art padding, and generated OG canvas to the same color. Verification passes: a second recolor scan reported zero changed pixels, all 34 source PNGs remain opaque RGB with exact `#FEF2E1` corners, the three-folder contact sheets were visually inspected, 17 test files / 151 tests passed, typecheck and production build passed at 214.07 KB JS gzip, and the strict asset audit reported zero issues.

**2026-07-31 — Mid-quiz checkpoint interruptions removed.**
Removed the transient checkpoint scenes after Q6 and Q9 so every answered question now advances directly to the next question; the Q12 → calculating/baking → result sequence remains unchanged. Deleted the dormant runtime scene contract and checkpoint CSS, and reconciled `plan.md`, `structure.md`, the Phase 4.5 interface plan, and the image inventory; checkpoint art remains only as inactive rollback source. Verification passes: 17 test files / 151 tests, typecheck, production build at 214.07 KB JS gzip, and live localhost/LAN HTTP 200 at `http://192.168.1.6:5173/`. A fresh in-app-browser interaction pass was not claimed because its local tab remained blocked on the earlier offline error page after the server restarted.

**2026-07-31 — Sixteen-icon SVG family completed.**
Converted the approved rounded-outline direction into 16 standalone runtime SVGs under `public/icons/`: the original source set plus close, Instagram, web/globe, mail, and thumbs-up, with the existing three-dot download retained rather than duplicated. Every file uses a square `64 × 64` viewBox, explicit aspect-ratio preservation, a consistent `4 px` rounded stroke, and the Parenteers deep-blue/orange tokens. All round geometry uses `<circle>` with a single radius; the set contains no ellipses or distortion transforms. XML/geometry validation passed with zero issues, the rendered contact sheet was visually inspected, the production build passed, and all 16 built SVG hashes match their sources.

**2026-07-31 — Figma-ready design-token reference exported.**
Added `docs/design-tokens.md` as a documented view of the implemented token system: current Fraunces/Plus Jakarta Sans typography, official and semantic colors, 390 px-resolved type and spacing scales, geometry, shadows, motion, layers, all 16 result accents, and recommended Figma organization. Runtime CSS and JSON remain the source of truth; the document also records that typography was not specified by the supplied brand pack and flags the two motion easing aliases currently referenced without token declarations.

**2026-07-30 — LAN development server started for phone interface review.**
Started Vite on `0.0.0.0:5173` and verified HTTP 200 through both localhost and the current Wi-Fi address, `http://192.168.1.6:5173/`. This is an ephemeral workstation process that must remain running while the phone review is in progress.

**2026-07-30 — Phase 5 share pipeline implemented locally; physical/unfurl sign-off pending.**
Advanced Phase 5 at the user’s direction while keeping the Phase 4.5 device review deferred. Rebuilt Story as a full-viewport three-panel viewer with tap-thirds, visible controls, hold-to-hide chrome for clean screenshots, swipe-down dismissal, direct WhatsApp, native link/file share capability checks, copy/download/screenshot fallbacks, same-node async button states, and swipe-dismissible toasts. Added a true 1080×1920 canvas PNG compositor using bundled character/brand assets and localized copy; added deterministic 1080×1350 type OG cards ×16 plus a 1200×630 default, strict OG asset auditing, and build-time executable route shells under `dist/r/{slug}/index.html`. Browser QA caught and fixed a caption-interpolation mount fault, retained Result scroll position, and a late Phase 4.5 CSS override. Final checks pass: 17 test files / 151 tests, typecheck, production build at 214.41 KB JS gzip, strict asset audit with 17 OG images at 130–261 KB and zero issues, 16 route shells with app scripts + matching OG metadata, rendered Android 390×844 and iPhone 393×852 Story panels with zero overflow/broken images, all three panels in bounds, reduced-motion parity, tap/hold/swipe behavior, and a visually inspected 964,790-byte 1080×1920 PNG. Final-domain absolute OG URLs, physical-device screenshot approval, Instagram share behavior, and live WhatsApp unfurl remain intentionally unclaimed.

**2026-07-30 — Full app Figma wireframe handoff complete.**
Created a unified 20-state low-fidelity wireframe on the existing `Wireframe` page in the supplied Parenting Personalities Figma file. The board covers the desktop QR gate, preloader, landing, intro, question default/selected states, exit confirmation, Q6/Q9 checkpoints, calculating, result hero/details, all three Story panels, gallery and detail sheet, ending, 404, and a Q1–Q12 scenario-art inventory. Every interface keeps an explicit illustration slot, and repeated question/result variants are documented as templates rather than duplicated production screens. Figma section: `8:2` (`https://www.figma.com/design/ec1stJUhIM10rQNZ1LjCZ4/Parenting-Personalities?node-id=8-2`). The final board screenshot rendered correctly; no Figma variables, libraries, components, or paid-plan-only features were used.

**2026-07-30 — Phase 4.5 implemented locally; physical visual sign-off pending.**
Recomposed the shared chrome, landing, all questions, Q6/Q9 checkpoints, main result, intro, calculating, end, gate, and preloader around the approved art-led direction. Added 12 neutral text-free scenario illustrations and two checkpoint heroes under `images/scene-art/`, a validated `scene-art.json` manifest, deterministic WebP processing, and strict asset auditing; runtime scene assets are 9–27 KB. Question behavior, randomized poles, persistence, haptics, gestures, and reduced-motion parity remain intact. Validation passes: 16 test files / 145 tests, typecheck, production build, strict 51-derivative asset audit, reference-surface screenshots, existing full-flow/reduced-motion browser QA, and a new 24-render ID/EN sweep covering all 12 unique question images with zero overflow, broken images, or runtime errors. Fresh Samsung and Instagram in-app-browser visual approval remains before Phase 4.5 is closed.

**2026-07-30 — Phase 4.5 art-led interface realignment examined and planned.**
The user clarified that `reference-start.png`, `reference-question.png`, `reference-section-chekpoint.png`, and the two `reference-result-main-*` files are direct composition references, with cute bakery illustration required across the experience. Comparison found that the current implementation often contains art inside cards or omits it entirely, while the references integrate illustration as a dominant emotional layer. Added `docs/phase-4-5-interface-plan.md`: shared wordmark/toggle and warm editorial shell, reference-led landing/question/checkpoint/result recomposition, 12 neutral scenario vignettes plus two checkpoint illustrations in a JSON art manifest, and a continuity pass for intro/calculating/end/gate/preloader. No runtime code changed in this planning session.

**2026-07-30 — Phase 3 real-Android sign-off complete.**
The user tested the live local experience on a Samsung Galaxy S25 FE and Samsung Galaxy A55 and reported that it runs well. The A55 supplies the required physical mid-range Android surface, while the S25 FE provides a second contemporary Samsung confirmation. Combined with the existing synthetic 4× CPU/WebGL measurements and automated gesture checks, this closes the remaining Phase 3 device-performance criterion.

**2026-07-29 — Phase 4 motion layer complete.**
Created deterministic Phase 4 derivatives: 16 full-bleed 900×900 result WebPs (47–96 KB), 16 lightweight 360×360 gallery WebPs (10–18 KB), four ordered 540×960 opening WebPs (26–32 KB), and an 11.7 KB 404 WebP. Added the real-progress 45→180°C preloader, ordered landing art sequence with split-text, velocity marquee, pointer/gyro parallax, draggable language thumb, tactile/swipe/FLIP question cards, rolling progress, edge-back gesture, animated exit sheet, 90/135°C checkpoints, JSON-timed baking sequence, confetti reveal, result tilt/scroll reveals, swipeable Story panels, horizontal bakery shelves with detail sheet, footer reveals, and animated 404 crumbs. All lifecycles are abort-safe and use the shared GSAP clock; reduced motion keeps every function while removing choreography. Reconciled the stale alpha-only test/documentation with the intentional opaque full-bleed treatment and upgraded the strict asset audit. Verification passes: 16 test files / 145 tests, typecheck, production build at 209.19 KB JS gzip (under the 300 KB budget), strict derivative audit, and hidden real-Chrome QA across landing, intro, selected question, Q6 interstitial, timed baking/skip gate, result, gallery sheet, end, 404, and reduced motion at 390×844 with zero overflow, zero broken images, and no runtime faults. Only the known `TBD` launch-link warnings remain.

**2026-07-29 — New image hierarchy, visual order, and Phase 4 intake reconciled.**
Scanned the complete `images/` tree and separated active sources from the archived first delivery. Added `images/README.md` as the authoritative inventory: six interface references ordered start → question → checkpoint → two main-result examples → detailed result; four opening variants ordered `var-1` → `var-4`; and all 16 new pastry personalities ordered by the fixed type registry rather than filename sorting. Verified dimensions, hashes, and opacity: interface/opening files are 941×1672, active personalities are distinct 1254×1254 opaque PNGs, active 404 art is 1254×1254, and the newly added `Preloader2.mp4` is a 10-second 1.76 MB reference. Updated orchestrator, plan, conventions, structure, data-spec, and companion-doc paths; `old images/` is now explicitly archive-only. Frame-level MP4 inspection remains pending because local headless Chrome did not decode it reliably.

**2026-07-18 — Official Parenteers identity applied across the runtime.**
Replaced the provisional bakery palette with the supplied canvas `#F0F1F5`, deep blue `#182799`, bright blue `#3073E9`, and orange `#E86811`; deep blue remains the accessible text/control pair while bright blue and orange stay graphical accents. Installed exact runtime copies of all six small brand/favicon assets, replaced the placeholder browser icon, added the Apple touch icon, put the compact mark in persistent chrome and the full wordmark on landing/gate, recolored the QR, WebGL dough shader, particle field, placeholder generator, and browser theme metadata, and synchronized plan/convention documentation. Per-type result accents intentionally remain decorative character-identity exceptions. Verification passes: 16 test files / 145 tests, strict typecheck, production build at 194.50 KB JS gzip, byte-for-byte brand asset audit, and hidden real-Chrome QA at 390×844 normal + reduced motion, `/r/pcte`, and the 1200px desktop gate; supplied logos loaded at natural resolution with no horizontal overflow.

**2026-07-18 — Phase 3 foundation implemented; real-Android performance sign-off remains.**
Ported the technique-52/59/60 gesture math into leak-free Pointer Events bindings, velocity sampling, rubber-band/friction/spring/snap helpers, and 20 focused tests. Built a persistent Three.js world facade driven only by `gsap.ticker`: bakery FBM dough gradient (09), 16-point flour wake (16), quality-tiered 150–200 ambient motes plus a reusable burst pool in one Points draw call (08), `uHeat`/result accents, DPR clamps, visibility pause, reduced-motion static frame, context/resize lifecycle, pre-route shader warm-up, answer haptic+visual pairing, and a cancellable 2-second FPS probe. Added exact `@types/three@0.185.1`; browser QA caught and fixed a same-tick FPS-scheduler recursion before handoff. Verification passes: 16 test files / 145 tests, strict typecheck, production build at 194.31 KB JS gzip (under the 300 KB budget), Cloudflare dry run, full 12-question flow with WebGL, 14 focused world checks, static reduced-motion screenshots, correct 390×844 frame containment, 75.2fps normal headless, and 75.3fps at 4× CPU throttle classified as the mid tier. A physical mid-range Android run is still required before the Phase 3 ✓ criterion can be called device-complete.

**2026-07-18 — Phase 2 complete; the full functional product path is live locally.**
Implemented the observable persisted store, History API router and guards, scene contract/manager, all landing→intro→12 questions→calculating→result→story/gallery→end screens, exit confirmation, 404, progress resume, bilingual toggle, result deep links, accessible QR desktop gate, and exact 390×844 continue-here frame. Activities remain a disabled non-navigating control while the URL is `TBD`; result answers now clear only after the result route is reached so a refresh on `/baking` is safe. Added the complete responsive zero-polish stylesheet and fixed long result names plus programmatic-heading focus treatment during visual QA. Verification passes: 8 test files / 101 tests, typecheck, production build, asset audit, Wrangler dry run, and 54 real-browser checks covering the entire mobile flow, refresh/resume, `/r/pcte`, persisted EN/ID, 404, reduced motion, QR gate, and framed fallback. Git remains user-owned and all changes are intentionally unstaged for manual commit/push.

**2026-07-18 — Phase 1 complete; repository support layer added.**
Confirmed the user-created `.git` is owned by `NagaPutih\tanar`, clean on `main`, and published to `ArdyTan/parenteers-parenting-personalities`. Added the strengthened ignore rules, EditorConfig, Node/npm pins, environment template, README, and GitHub CI. Transcribed all five runtime JSON files: 12 questions, 16 types, exact default config, and 95 matching EN/ID keys (all 69 quiz-02 table rows verbatim plus 26 required page/activity keys). Added strict types, scoring from raw/persisted answers, answer-pair randomization, runtime data assertions, interpolation, release-TBD guard, and 16 non-overwriting alpha WebP placeholders. Verification passes: 5 test files / 49 tests, typecheck, production preview build, 390×844 dev boot with the expected TBD warning and no errors, placeholder idempotence, asset audit, and Wrangler upload dry run. `build:release` correctly blocks the unresolved activities/site URLs.

**2026-07-18 — Codex-created local Git metadata removed at user request.**
The workspace folder was owned by `NagaPutih\tanar`, while Codex-created `.git` internals were owned by `NagaPutih\CodexSandboxOffline`; this split could block the user's local Git client. The verified project-local `.git` directory was deleted so the user can initialize/add the repository manually. The temporary exact-path global `safe.directory` entry was also removed. Application files and assets were preserved.

**2026-07-18 — Phase 0 implemented locally; live Cloudflare authentication is the only closeout gap.**
Initialized Git on `main`; scaffolded pinned Vite 8 + TypeScript 7 + Vitest + Wrangler; added the Cloudflare static-assets SPA configuration, Workers Builds handoff, self-hosted Fraunces/Plus Jakarta Sans subsets (89,780 bytes total), design tokens/base shell, favicon, and deterministic asset audit. Added a safe CLI launcher for the workspace's `#` path. Copied and SHA-256 verified the exact 34 motion guides, and normalized cross-document contract drift before coding. Final verification passes: 3/3 tests, typecheck/build, Wrangler upload dry run, local fonts, 390×844 mobile edge, reduced-motion tokens, 1200px desktop 390×844 frame, no horizontal overflow, and `/r/pcte` SPA fallback. Visual QA caught and fixed framed-container typography/overflow. Intake audit found all 20 supplied PNGs at 1254×1254 RGB; the 16 characters still need alpha backgrounds. `wrangler whoami` is unauthenticated, so no live URL is claimed yet.

**2026-07-17 — Hosting decided: Cloudflare Workers (free plan, static assets).**
Chosen over the user's Cloudways box (1GB Basic, $11/mo): the app is fully static, Workers serves static assets free/unlimited (viral IG spikes cost $0 and can't saturate a VPS), and Cloudflare's Jakarta edge PoP serves the Indonesian audience faster than a single-origin server — which the plan §10 LCP budget depends on. Cloudways stays for whatever it already hosts; this project doesn't touch it. plan.md §1 + Phase 0 updated accordingly.

**2026-07-17 — Planning complete.**
Read the three content docs; researched Awwwards criteria; user redirected taste source to `D:\#dev\WebAnimation Library` (99 techniques + guides — now the benchmark, saved to memory). Produced the doc set: `plan.md` (phases, budgets, §8 moment→technique blueprint, §14 decisions), `structure.md` (architecture + reuse recipe), `conventions.md` (rules), `data-spec.md` (JSON db spec), `progress.md` (this file), `CLAUDE.md` (orchestrator). No code exists yet. All §14 decision defaults stand unless the user says otherwise.
