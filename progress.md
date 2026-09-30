# progress.md — Living Status
**What this is:** the single place a fresh session looks to know where the project stands. **Every working session ends by updating this file** — flip phase statuses and prepend a dated log entry. Keep it terse; detail belongs in the other docs.

## Status snapshot

| Phase (plan.md §13) | Status |
|---|---|
| Content & research docs (pre-project) | ✅ done |
| Planning & architecture docs | ✅ done (2026-07-17) |
| 0 — Setup (scaffold, tokens, deploy, copy guides) | ✅ done; live at `quiz.parenteers.id` (confirmed by Ardy 2026-08-23) |
| 1 — Data & i18n (transcribe .md → JSON, scoring + tests) | ✅ done (2026-07-18) |
| 2 — Core flow, zero polish | ✅ done (2026-07-18) |
| 3 — Gesture & WebGL foundations | ✅ gestures done (2026-07-30); WebGL half removed 2026-08-02 (plan §6) |
| 4 — Motion layer | ✅ done (2026-07-29) |
| 4.5 — Art-led interface realignment | ✅ superseded by Phase 5.5 |
| 5 — Share pipeline | ✅ done; live domain + 16 OG shells deployed and device-tested (confirmed by Ardy 2026-08-23) |
| 5.5 — Brilliant-spec interface revision | ✅ done; headless and real-device review complete (confirmed by Ardy 2026-08-23) |
| 6 — QA hardening | ✅ done; Ardy confirmed testing across the target devices (2026-08-23) |
| 7 — Launch extras (optional) | 🟨 sound layer shipped early (2026-08-02); analytics, founder-note flag and Awwwards assets remain |
| 8 — Personality PDF booklet | 🟨 A is the sole final template; the approved Saweria closing is live across all 32 ID/EN booklets and the shared Result component covers all 16 types. Worker version `aa06f077-1bae-4378-88ee-e71198542425` deployed and hash-verified 2026-09-08; real-device WebView sign-off remains |
| 9 — Single-action questions and flow cleanup | 🟨 responsive tap-only questions plus Landing/Opening/Baking/Gallery cleanup deployed 2026-09-30; Ardy's browser/device review pending |

## Next action

**Active workstream: revised single-action questions (Phase 9).** Ardy's
`images/Questions-sample-newlayout.jpg` supersedes the swipe composition. The Question scene now
uses 34px horizontal padding, 16px progress stars, art centred on both axes, a centred prompt, and
two Tim A/B (Team A/B) bottom tap choices. A choice still saves its own randomized pole and
advances; Back remains. Baking's Q12 edit control is removed. The Q1-only fixed zoom is removed. All illustrations
now size from the flexible art band's height, keep at least 12px of bleed on each side, and cap
at 136% of the scene width. Question-screen typography also responds to width and height.
Ardy's annotated follow-up lifts the art 8px and gives the question stack 8px top and 28px
bottom padding, raising the title while opening space toward the choices.
Ardy asked to do browser QA himself, so this revision has not been checked in Chrome or on a
device by Magda. The preceding fixed-size revision passed typecheck, 171 tests, build and isolated
Chrome QA; those results do not verify this new revision. Next: Ardy's browser review at normal
and short phone heights, then physical Instagram WebView acceptance including native back and
sound unlock. Ardy explicitly waived browser QA for the 2026-09-30 deploy; this
does not close the Phase 9 acceptance gate.

**2026-09-30 additional UI cleanup:** Landing now presents one Start button, clearing any
unfinished answers instead of offering Resume. Its static portrait artwork uses the extra
space left by the removed control and a higher crop intended to keep the bakery group inside a
borderless, canvas-matched band. Opening omits the extra short disclaimer paragraph;
Result keeps its terminal disclaimer. Gallery cards are transparent with a fine tan border
and no shadow; clicking one navigates directly to its Result, with the detail dialog removed.
Ardy requested no QA for this batch, so these changes are awaiting his browser review.

**Release 2026-09-30:** Static gates passed: 171 tests, strict asset audit,
32-booklet PDF QA, release configuration, typecheck, and protected production
build with all 16 result stubs. The release build excludes ignored private
`public/_figma/` and source maps; `dist/_figma` and `*.map` are absent.
Cloudflare Worker `parenting-bakes` version `57d5c713-541b-40ce-a78e-44269ccd34ca`
is live at `quiz.parenteers.id` with 100% traffic. Public HTTP byte checks
matched 23/23 local artifacts, including all 16 result routes and two PDFs.
Rollback predecessor: `aa06f077-1bae-4378-88ee-e71198542425`.
Chrome CDP on port 9223 was inactive; Ardy requested deployment without browser
QA. The working tree remains uncommitted and unpushed.

**Existing Phase 8 follow-up: the per-type PDF booklet.** Layout A is final and is now the only
generator path. All 54 commissioned illustrations are installed, all 32 ID/EN booklets were rebuilt,
and `npm run qa:pdf` enforces their file set, 16-page/A4 contract, 1.2 MB ceiling, extractable
bilingual content, complete activity selection, permission lines and embedded fonts. B/C review
artifacts were removed. The Result still exposes one PDF section while the dock remains save-only.

The approved Result booklet reward and final Saweria support card are implemented locally across the
shared Result component, which serves all 16 personality routes. The 32 production ID/EN PDFs are
also rebuilt: page 16 has one focused Saweria QR and a lightweight icon row for `@parenteers` plus
`parenteers.id`, with no quiz QR or quiz URL. `qa:pdf`, the strict asset audit, the production build,
and normal plus reduced-motion `qa:phase55` all pass; the build contains all 16 result routes. The
support path uses the public `saweria.co/parenteers` URL and a committed local QR, never the widget
stream key. The release changes are committed on `origin/main` and deployed to Cloudflare Workers.
Phase 8 follow-up: confirm the Result and booklet in the Instagram in-app browser on Samsung plus one iOS
device.
Phase 0–6 are complete by Ardy's confirmation; Phase 7 remains intentionally on hold.

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
- [x] Phase 0 deployment/build setup confirmed complete by Ardy on 2026-08-23; the site is live at `quiz.parenteers.id`
- [x] Official Parenteers palette, logo set, and favicon delivered and applied (2026-07-18); existing fonts retained because the brand pack contains no typography specification
- [x] **All 54 PDF booklet illustrations generated, QC'd and installed** (2026-08-23). Care 25/25, play 20/20, furniture 9/9; inventory, dimensions, hashes and a full visual review against the art brief §5/§9 all pass. Derivatives and the 32-PDF rebuild are done — nothing outstanding here.
- [x] **PDF closing decision revised 2026-09-03:** page 16 uses one Saweria QR; the quiz QR is removed, and Instagram plus `parenteers.id` appear as icon links. Deterministic picks and ID + EN remain unchanged. Recorded in `docs/personality-pdf-plan.md` §15.
- [ ] Any overrides to plan.md §14 decision defaults

## Session log (newest first)

**2026-09-30 — Phase 9 candidate deployed to Cloudflare Workers.**
Ardy reversed the prior hold and instructed deployment without browser QA.
Confirmed the exact `parenting-bakes` Worker in Ardy Tanto's Cloudflare account,
with `aa06f077-1bae-4378-88ee-e71198542425` active before release. Found a
Vite `.js.map` in the first build, so release builds now disable source maps
and fail if one reaches `dist/assets`; private `_figma` exclusion remains.
Protected build and Wrangler dry run passed with 273 assets. Wrangler uploaded
19 new or changed assets and deployed version
`57d5c713-541b-40ce-a78e-44269ccd34ca` to `quiz.parenteers.id` and
`parenting-bakes.ardy-tanto.workers.dev`. Cloudflare reports 100% traffic on
that version. Public byte comparison passed 23/23 artifacts: homepage, all 16
result routes, JS, CSS, one ID and one EN PDF, Saweria QR, and default OG.
The old source-map URL serves HTML fallback rather than a source map.
Browser, short-height, reduced-motion, and physical Instagram WebView QA were
not run at Ardy's direction; Phase 9 acceptance remains pending. No commit or
Git push ran.

**2026-09-30 — Release candidate prepared; deployment deferred by Ardy.**
Initial `npm test` failed 1/171 because the UI-key count assertion still
expected 88 after the two retired strings were removed. Updated the assertion
to 86 and synchronized the editorial table with the current Tim A/B copy;
15 files and 171 tests now pass. Added a protected `build:release` that holds
the ignored private `_figma` folder outside Vite's public directory, checks
`dist/_figma` is absent, and restores the folder even on build failure;
`deploy:dry` uses the same build. Release configuration, 32-PDF QA, strict
asset audit, typecheck, production build, all 16 prerendered result routes,
and `git diff --check` pass. Chrome CDP port 9223 was inactive at the one
read-only check. Ardy selected the option to wait for his browser/device
review before deploying. No Cloudflare deploy, Git push or commit ran.

**2026-09-30 — Landing, Opening, Baking, and Gallery feedback applied.**
Removed Landing Resume and its progress label; Start always begins fresh. Removed the
Landing art tilt handlers, centred the portrait crop higher inside the enlarged single-CTA
band, and matched its flat background to the page. Removed the Opening's extra short
disclaimer paragraph and the Baking Q12 edit button. Gallery cards now use a subtle tan
border, transparent background, and no shadow; selecting a card navigates directly to
that personality Result. Deleted the gallery detail-dialog implementation and stale UI
strings for the removed Opening/Baking text. Updated browser QA expectations without
running them; Ardy will review in his browser. No build, deploy, or push ran.

**2026-09-30 — Art and question title lifted from annotated browser screenshot.**
Moved the responsive illustration up 8px and changed the question stack from 0/16px to
8/28px top/bottom padding. This lifts the title and opens space above and below it while
the flexible art row absorbs the added stack height. Copy and answer behavior are unchanged.
Per Ardy's direction, no browser QA or build was run; his browser review remains pending.

**2026-09-30 — Question art and type made responsive; browser QA handed to Ardy.**
Removed the fixed 125% Q1 transform and the 560×373 CSS art box. Every question illustration
now uses the middle band's width and height: minimum viewport width plus 24px, preferred width
at a 3:2 aspect from band height, maximum 136% of scene width. It remains centred and clipped
inside the band. Added width-and-height responsive sizes for question navigation, close mark,
option labels/copy, previous-answer text and helper; the headline already had both axes.
Framed presentation keeps width-only fallbacks so browser `svh` cannot shrink its type. Updated
the browser QA contract for this sizing, but did not run QA or build: Ardy explicitly chose to
check the revision himself in his browser. Acceptance and deployment remain pending.

**2026-09-30 — Q1 illustration increased 25% from its centred base.**
Scaled Q1 alone to 125% of 560×373 (700px transformed width at 390px viewport), retaining
its centred position and the other 11 illustrations' size. Updated the Phase 5.5 browser
contract with a Q1 short-viewport capture. Typecheck, 171 tests and build pass. Inside the
approved loopback-only `bwrap` namespace, `qa:phase55` normal and reduced motion and
`qa:phase9` pass, then the added Q1 390×720 assertion passes on a follow-up normal run.
Visually inspected Q1 at both 390×844 and 390×720: illustration is deliberately cropped by
its middle band, while question and both choices remain visible. Physical Instagram WebView
review and deployment remain pending.

**2026-09-30 — Q1 art reduced 50%; isolated Chrome QA passed.**
Ardy chose OS-level network isolation for browser QA and asked to halve the 2× Q1 art. Removed
the Q1-only transform and left the centred 560×373 image shared by all questions. Verified that
`bwrap --unshare-net` exposed only `lo` with no LAN or internet route, then ran Vite and Chrome
CDP together inside that namespace. `qa:phase55` normal and reduced motion and `qa:phase9`
all exited successfully; the latter covered ID/EN tap and keyboard answers, randomized pole
binding, Q12 correction and Result navigation. Inspected Q1 at 390×844 and Q5 at 390×720:
art, prompt and both choices remain visible. Typecheck, 171 tests, Vite build and diff checks
pass. The earlier proxy-sink LAN incident and the successful loopback-only workaround are
recorded in the Obsidian project playbook. Physical Instagram WebView QA remains pending;
no deploy or push ran.

**2026-09-30 — Art doubled and browser isolation failure during Question QA.**
After Ardy authorized option B, started isolated local Chrome CDP against the already running
Vite server. Initial browser QA exposed a stale overlap assertion (measuring the transformed
image rather than the clipped art band) and a real Q5 short-height type-scale floor; corrected
both. The grid track had remained anchored at x=0 despite `place-items: center`; added track
centering and scaled Q1 art 2×. A Q5 short-viewport capture showed that applying 2× to every
question would cut off both characters, so the extra scale was scoped to the annotated Q1 image;
all art keeps the centring fix. Targeted captures measured Q1 image width 1120 at x=-365 on
390×844 and Q5 choices above the fold on 390×720, both with zero horizontal overflow. Typecheck
and 171 tests pass. A repeat full QA was stopped because socket inspection showed the QA Chrome
connected to LAN ports 8008/8009 despite its proxy sink. No listener remains on CDP port 9223;
payload and cause are unconfirmed. Documented the material error in the Obsidian project
playbook. Full normal/reduced browser and physical Instagram WebView QA are pending a network
isolation choice; no deploy or push ran.

**2026-09-30 — Question layout revised to the supplied 390×768 reference.**
Removed the draggable scenario and swipe answer binding; kept one-tap auto-advance, displayed
answer/pole binding, keyboard buttons, Back and Baking correction. Enlarged and centred the
illustration in a flexible middle row, centred the question, changed question chrome to 34px
side padding and 16px stars, and restyled the two bottom choices as Tim A/B. Updated ID/EN
helper copy and the relevant QA contracts and project handoff docs. Typecheck, all 171 tests,
script syntax, Vite client build and `git diff --check` pass. Chrome CDP port 9223 was inactive;
no revised browser or device acceptance is claimed. The pre-existing uncommitted workbook
output and prior `progress.md` log entry were preserved.

**2026-09-29 — Quiz content workbook exported for editorial review.**
Created `outputs/01a0eb0c-8eea-75a3-ae0c-085188bbd129/parenteers-quiz-content.xlsx`
from the current JSON registries. It has separate ID/EN question, personality, UI, parent-care,
child-activity, and weekly-extra tabs, plus the ID product catalog and a source index. Preserved
question IDs and answer poles, including the Phase 9 copy. Verified all 14 tabs, filters, row counts,
and exported cell content against the JSON. This is a review copy; runtime data and phase status did
not change.

**2026-09-28 — Phase 9 canonical browser QA completed locally.**
After Ardy authorized opening Chrome, started the existing Vite/Chrome toolchain on loopback with
Chrome CDP port 9223. An initial Chrome launch unexpectedly attempted GCM registration despite
`--disable-background-networking` (`PHONE_REGISTRATION_ERROR`, `wrong_secret`); stopped it and
relaunched the same browser with an isolated profile, a loopback-only proxy sink and localhost
bypass. The QA Chrome's observed sockets were localhost only. A later unfiltered socket check
showed non-local connections from pre-existing Chrome processes (PIDs 6350 and 40250), not the
temporary QA Chrome (PID 59705), which was stopped for inspection. The incident and observation
limit are recorded in the Obsidian project playbook. `qa:phase55`
normal and `--reduced` each reported zero failures/runtime errors across all 12 questions,
390×844 and short 390×720 checks. `qa:phase9` completed all 12 ID and EN answers using tap,
directional swipe and keyboard, checked cancellation/vertical intent, stored pole binding,
Q12 Baking correction, and reached Result in both languages with zero runtime errors. Visual
inspection caught and removed the idle deck outline. Typecheck and 171 tests pass. Physical
Instagram WebView acceptance and any deployment remain pending.

**2026-09-28 — Canonical browser QA requested; Chrome prerequisite still inactive.**
Ardy chose option A to continue Phase 9 QA with the project's Vite and Chrome CDP harness.
One read-only check of port 9223 and `/json/version` found no listener (`curl: (7) Failed to
connect to 127.0.0.1 port 9223`). Per the project runtime-readiness gate, no substitute browser
or server was launched and no browser acceptance is claimed. Waiting for Ardy to start Chrome
with remote debugging on port 9223, then run Vite and the normal/reduced QA harness.


**2026-09-28 — Phase 9 local interaction implemented; browser QA waiting on runtime.**
Replaced selection plus Next with stationary left/right response buttons and a movable scenario
card. Tap or committed horizontal swipe now saves the displayed answer object's pole once and
advances. Removed question edge-back, added cancellation, short question handoff, saved-answer
state on revisit, bilingual prompts and accessible button names, and last-answer correction in
Baking with timer cancellation. The Phase 5.5 QA harness now checks the new two-button composition
and all 12 questions. Validation: 171 tests pass, typecheck passes, build passes at 101.45 KB JS
gzip, and `git diff --check` passes. The canonical Vite and Chrome 9223 ports were inactive at the
read-only check, so no browser or device acceptance is claimed; user choice is pending. The build
regenerated OG images, which were restored because this feature does not change them.


**2026-09-28 — All questions restructured; Phase 9 swipe development planned.**
Rewrote the 12 scenarios and 24 responses in both ID and EN, preserving question IDs, dimensions,
poles and scenario-art subjects. Q7–9 explicitly ask for the initial response. Updated the matching
editorial section and added `docs/question-swipe-plan.md`: left/right card drag, stationary tap
alternatives, one commit/advance, cancellation and race handling, removal of custom edge-back,
Baking correction, reduced motion, file-by-file steps and full QA/device gates. Routed Phase 9
through `plan.md` and `AGENTS.md`. Source inspection confirmed checkpoint strings currently have
no question-scene renderer. Runtime interaction is not implemented; no deploy or browser QA ran.
Validation: existing data-integrity/scoring/randomization suites passed (3 files, 67 tests). A
source comparison confirms all 12 IDs/dimensions/pole pairs are preserved and all 72 localized
scenario/answer strings match the editorial reference. `git diff --check` passes. The Obsidian
quiz playbook links this decision and the local development plan. Browser layout remains pending.

**2026-09-28 — Single-action answer interaction assessed; implementation undecided.**
Reviewed all 12 current question pairs and `src/scenes/question.ts`: tap and card swipe both
save a selection, then require Next. The 16 count refers to result types; removing confirmation
would reduce answer actions from 24 to 12, excluding other journey controls. Recommendation for
discussion: tap either answer to advance, with directional swipe as an optional equivalent and a
visible back/edit path. Keep the two explicit parenting responses: a no to one response does not
necessarily mean the other, especially for Q7–9. Any directional redesign must show both meanings,
preserve randomized answer-to-pole mapping, and resolve the existing left-edge back gesture.
No runtime/copy changes or browser tests were made; this is a source-based proposal, not acceptance.

**2026-09-08, local design and review artifacts excluded from Git.**
Added explicit ignore rules for the local `public/_figma/` scratch exports and `output/` review
artifacts, then removed the redundant 71 MB `images/image-backup.zip` from the tracked working tree.
The source artwork, production derivatives and committed PDF booklets remain untouched. The ZIP is
still recoverable from Git history; no commit, push, history rewrite or repository cleanup ran.

**2026-09-08, Saweria Result and 32 revised booklets deployed to Cloudflare Workers.**
Validated the authenticated account as `Ardy Tanto`, ran the release configuration gate and
production build, then deployed Worker version `aa06f077-1bae-4378-88ee-e71198542425` to both
`parenting-bakes.ardy-tanto.workers.dev` and `quiz.parenteers.id`. Live verification compared every
production PDF against its local source: 32 checked, 0 hash mismatches. The live Saweria QR is also
byte-identical, the home page references the new JS bundle, the PGDE route carries its type-specific
OG URL, and both Worker endpoints return 200.

Protected the unrelated user-owned `public/_figma/` throughout the release by moving it outside the
public tree for the build and restoring it afterward. It is absent from `dist`; requesting its old
path on the SPA returns the generic HTML shell rather than the private PNG. The generated OG diffs
were restored after deployment. No dependency update was accepted despite Wrangler advertising a
newer version. Remaining acceptance work is the physical Instagram WebView check on Samsung and one
iOS device.

**2026-09-08, Fedora launcher and Saweria release changes committed and pushed.**
Revalidated the intended release scope before committing: launcher shell syntax, 14 test files /
168 tests, typecheck, all 32 production PDFs, strict asset inventory and the production build are
green. Kept the executable Fedora launcher in its own small commit, then committed the shared
Result support UI, bilingual copy, static QR, generator/QA contracts, documentation and all 32
rebuilt production booklets together. Pushed both commits to `origin/main`. Deliberately left the
local review artifacts in `output/` and the unrelated user-owned `public/_figma/` directory
untracked; no Cloudflare deployment was performed.

**2026-09-04, approved Saweria treatment rolled out to every Result and production PDF.**
Applied the reviewed design to the shared Result component used by all 16 personality routes and
rebuilt all 32 production booklets across ID and EN. Page 16 now has one Saweria QR, localized
value-and-impact copy, and exactly three link annotations: Saweria, Instagram `@parenteers`, and
`parenteers.id`; the quiz QR and quiz URL are absent. Rendered and visually inspected production
PGDE page 16 in both languages. `qa:pdf` passes all 32 files at 16 A4 pages, 13 embedded fonts,
three closing links and 1,076–1,157 KB each, with no clipping or missing bilingual content.

The Result keeps its QR and orange CTA vertically stacked, retains one save-image sticky action,
and exposes no widget stream key. Verification passes: 14 test files / 168 tests, typecheck,
production build with all 16 result routes, strict asset audit with zero issues, and normal plus
reduced-motion browser QA at 390×844 and the 390×720 short view with zero failures or runtime
errors. No commit, deploy, or public upload was performed.

**2026-09-03, support copy tightened around value and impact.**
Selected a marketing-focused combination of Ardy's options 2 and 1: first acknowledge the value the
reader received (“Kalau ini bermanfaat buat kamu…”), then name the concrete outcome (“Dukunganmu
membantu Parenteers terus membuat produk dan pengalaman yang bermanfaat untuk lebih banyak orang
tua”), with the direct CTA “Dukung Parenteers”. Kept `kamu` instead of formal `Anda` to match the
product's conversational register; did not use the pantun at this conversion point because its
indirect future promise is less scannable and less specific about impact. Added equivalent EN copy
and a shorter PDF line carrying the same promise.

Regenerated only the Indonesian PGDE review artifact; all 32 production PDFs remain untouched. The
sample is 16-page A4 and 1,122,864 bytes with no clipping and exactly the intended Saweria,
Instagram and Parenteers web annotations. Visually reviewed the latest Result and page 16 renders.
Tests (168), typecheck, production build, and normal plus reduced-motion `qa:phase55` all pass with
no runtime errors, sticky overlap or horizontal overflow. Batch rebuild still awaits approval.

**2026-09-03, Saweria focus pass applied to the web and one PDF sample.**
Applied Ardy's review without touching the 32 production booklets. On Result, changed the support
action from a two-column row to a strict vertical sequence: 168px QR, scan hint, full-width orange
CTA and readable URL. Added browser assertions for QR size, vertical ordering and CTA width; normal
and reduced-motion `qa:phase55` pass with no overlap, runtime errors or horizontal overflow.

On PDF page 16, removed the quiz QR and quiz URL entirely. The single Saweria QR now owns the focal
card; below it, the existing Instagram and web SVG icons link to `@parenteers` and `parenteers.id`.
Regenerated only `output/pdf/pgde-saweria-review.pdf`: 16-page A4, 1,122,788 bytes, no clipping,
embedded fonts and exactly three page-16 link annotations (Saweria, Instagram and Parenteers web).
Rendered and visually inspected the latest page 16. Tests (168), typecheck, production build and
the unchanged 32-file `qa:pdf` pass. Batch rebuild still waits for explicit sample approval.

**2026-09-03, Saweria support implemented; one PDF review sample only.**
Added a final optional-support card to the Result in ID and EN: warm-tan field, direct orange Saweria
link, secondary local QR, explicit no-pressure copy, and enough bottom clearance for the existing
single save-image dock. The QR and CTA target the public `https://saweria.co/parenteers` page; the
Saweria widget URL and its stream key are not shipped in markup, assets or PDFs. Extended config
typing/validation, exact i18n inventory and `qa:phase55` coverage for placement, localization,
external-link safety, QR loading, one-action dock, token non-exposure, overflow and bottom overlap.

Updated page 16 of the Layout-A generator to retain the general `parenteers.id` activity CTA and
show two clearly labelled QR cards: quiz sharing and optional Saweria support. Added a guarded
`--output` review mode that requires one language and one slug, then generated only the Indonesian
PGDE sample at `output/pdf/pgde-saweria-review.pdf`; none of the 32 production PDFs changed. The
sample is 16-page A4, 1,137,205 bytes, has embedded fonts, extractable copy and zero clipped pages;
page 16 was rendered and reviewed at full resolution, with all three URL annotations present.
Verification: 14 test files / 168 tests, typecheck, production build, unchanged 32-file `qa:pdf`,
and normal plus reduced-motion `qa:phase55` all pass with no runtime errors or horizontal overflow.
Awaiting Ardy's visual approval before the 32-file rebuild.

**2026-09-03, Result booklet reward promoted visually.**
Reworked “Simpan profil lengkapnya” into a centered, spacious reward section with the current
personality illustration above its title and a full brand-blue, borderless CTA carrying the standard
orange expression accent. Corrected its stale 14-page copy to the shipped 16 pages in ID and EN.
Kept the sticky dock intentionally focused on the save-image/Story action; PDF opening remains the
single WebView-safe link in its dedicated section. Added `qa:phase55` coverage for the PDF image,
spacing, CTA treatment, link contract, section order, bilingual page count, overflow and one-action
dock. Warmed the sticky save button's inner outline from stark white to the same cream as the
editorial canvas, preserving separation over blue content without a sticker-like edge. Both motion
modes pass every new Result/PDF assertion. Also pinned the desktop pointer signals
inside the QA harness after current headless Chrome stopped exposing `(pointer: fine)` consistently,
which had prevented its existing 820px stacked-gate case from mounting the gate at all. Final checks:
14 test files / 168 tests, typecheck, production build, and the complete normal plus reduced-motion
`qa:phase55` suites all pass with no runtime errors or horizontal overflow. The two PDF captures were
reviewed visually at full resolution.

**2026-09-03, Fedora app-server launcher added.**
Added executable `Start App Server.sh` as the Fedora counterpart to the Windows BAT launcher. It
starts Vite on port 5173, opens the default browser, detects an already-running project server, and
supports `PARENTING_BAKES_SKIP_BROWSER`. Shell syntax and the executable bit were verified.

**2026-08-28, final layout-A booklets committed, pushed and deployed.**
Committed the sole A generator, all 54 optimized illustrations and all 32 rebuilt ID/EN booklets as
`8f43ecd`; pushed `main`, and GitHub CI run `33089911498` passed. Authenticated Wrangler against the
correct Cloudflare account (`Ardy Tanto`) without persisting its account id in the repository, then
deployed 272 static assets: 106 uploaded and 128 reused. Cloudflare activated Worker version
`532b8dba-725e-4d6b-9d00-e61ee73ab744` on both `parenting-bakes.ardy-tanto.workers.dev` and the
`quiz.parenteers.id` custom domain. Live ID and EN FCDE PDFs return HTTP 200 as `application/pdf`;
each production SHA-256 is byte-identical to its committed file. The untracked `public/_figma/`
scratch directory was excluded from the build and preserved locally. Instagram WebView and physical
iOS review remain external acceptance checks.

**2026-08-27, layout A finalized; B/C retired; content and safety audited.**
Kept A's 16-page structure and the intentional 3+2 parent-care split. Removed the B/C sample PDFs
and deleted their generator paths after taking a local rollback snapshot at
`/tmp/parenteers-pdf-variants-JcAuOI`. Audited both languages and tightened child-safety wording for
small parts, water, furniture, art materials and adult supervision; every child activity now has a
non-empty safety line. Parent recovery no longer implies leaving a child unattended. Corrected the
deterministic child selector so all 20 commissioned activities appear across the 16 types instead of
silently excluding four.

Rebuilt all 32 A PDFs. `npm run qa:pdf` passes all files at exactly 16 A4 pages, 0 content issues,
embedded fonts and 1,060–1,144 KB; generator overflow checks report no clipping. `npm test` passes
14 files / 168 tests, typecheck and script syntax are clean, and strict asset audit reports 0 issues.
Visually reviewed complete ID/EN FCDE contact sheets plus ID FCTN, then inspected pages 8, 10, 11,
13 and 15 at high resolution: the requested text/image gap is present, the 3+2 split is intact, and
the newly reachable activities and safety lines render cleanly.

**2026-08-27, FCDE sample feedback applied to layouts A and C.**
Layout A page 8 now keeps a measured 6 mm gap between the final care-story paragraph and the `f6`
illustration. Layout C now fits all five parent-care rows on page 10 instead of splitting them 3 / 2;
the redundant page was removed and every following folio/progress tick now closes at 15/15. Rebuilt
only the two Indonesian FCDE review samples (`fcde.pdf` and `fcde-c.pdf`), not the full 32-booklet
set. Both generator overflow checks passed, the changed pages and the complete C contact sheet were
visually reviewed, text extraction finds all five care titles on page 10, and 14 test files / 168
tests plus typecheck are clean.

**2026-08-27, three FCDE booklet design samples opened for comparison.**
Started the local Vite project and opened the Indonesian Bagel booklet variants side by side:
`fcde.pdf`, `fcde-b.pdf`, and `fcde-c.pdf`. This was a read-only comparison handoff; no PDF was
regenerated or edited.

**2026-08-23, booklet art QC'd and wired end to end (Phase 8).**
Reviewed all 54 delivered illustrations before touching code, because a bad frame is 32 committed
PDFs to redo. Filenames cross-check exactly against the 25 `parent-care.json` and 20
`child-activities.json` record ids plus `f1`–`f9`; geometry is exactly 1024×768 for the 45 tiles and
1536×768 / 1536×1024 for the bands; all 54 are 8-bit sRGB with no alpha. Read every frame on contact
sheets and zoomed the ones most likely to break the hard rules — the candle on `t-write-dont-say` is
unlit, the phone on `t-ten-quiet` is face-down, `p-empty-hour`'s calendar and `f5`'s fridge list carry
no numerals, `e-old-route`'s warung has no signage, and `f2`'s book spines are blank. No people, no
characters, no text anywhere. Also simulated the `object-fit: cover` band crops and the 34mm tile
squint test rather than assuming they'd hold.

Then implemented the pipeline. New `scripts/process-pdf-art.mjs` (`npm run assets:pdf-art`) writes
1240px WebP masters to `public/pdf-art/**`, asserting ids against the registries and sizes against the
brief — it exits non-zero rather than quietly writing 53 files. Set the `image` field on all 45
records (line-targeted so the diff is 45 lines, not a reformat of both files), and taught the
generator to resolve tiles by record id and furniture by slot id. Memoised `publicImage`: the same 54
pieces appear in every booklet, so without it they were re-encoded 32 times.

One real defect surfaced and was fixed by measurement, not guesswork. Filling the bands clipped page
15 by 5px on the eight longest ID booklets (`**n`). Dumping the page's box geometry showed `.grow`
resolving to 438.8px — exactly the img's intrinsic 116mm at 174mm wide. `height: 100%` on the img is
cyclic against an auto-height figure, so it fell back to intrinsic ratio, that became the flex item's
min-content height, and the column could no longer shrink. `.grow > .frame { flex: 1 1 0 }` breaks the
cycle; the band still floors at `frame--wide`'s 56mm and `object-fit: cover` crops the rest.

Verification: 32/32 booklets rebuilt with **no page clipping**, two consecutive rebuilds byte-identical
(the normalizer still holds), typecheck clean, 14 files / **168 tests** passing, production build clean
with both registries confirmed absent from the bundle, and `assets:audit --strict` at **0 issues** —
extended with a `pdf-art` group table and a booklet-weight table, then negative-tested by renaming one
source to confirm it actually fails. Cost of the art: each booklet went ~520 KB → ~1.1 MB, **34 MB**
across all 32.

**2026-08-23, PDF illustration correction checklist completed.**
Reviewed all 54 source illustrations against the acceptance checklist in
`parenteers-booklet-art-prompts.txt`, including contact sheets and a 34 mm-wide activity-tile pass.
Regenerated three hard failures only: `p-brain-dump.png` replaced writing-like marks with broad
abstract colour swashes; `d-leave-one-undone.png` retained the moonlit single-dish scene while
lifting the interior back into the reference cream family; and `treasure-basket.png` replaced the
long spoon/whisk with short, chunky objects consistent with its safety line. The final inventory is
54/54 with zero filename or dimension errors, fully opaque pixels and 54 unique SHA-256 hashes.
Full-resolution/contact-sheet review found no remaining obvious people, hands, faces, characters,
text, numbers, logos, deep water, flame, blades or loose cords. Derivatives and PDFs were not
rebuilt in this correction pass.

**2026-08-23, PDF illustration Batches 4–7 completed; source-art set is 54/54.**
Generated all twenty child-play tiles and all nine page-furniture bands with the built-in image
generator, using `pcte-story.webp` for scene/light/paper treatment and `pcte-croquembouche.webp` for
object rendering and cream-ground consistency. Message A's no-people/no-characters/no-text/safety
rules were repeated on every call. Saved the project-bound sources under `images/pdf-art/play/` and
`images/pdf-art/furniture/`, normalizing only the final pixel dimensions. A contact-sheet review
found no obvious text, people or characters. Registry diff: zero missing or unexpected filenames;
dimensions: zero mismatches; total: 54 PNGs with 54 unique SHA-256 hashes. No derivatives were
created and the 32 placeholder PDFs were not rebuilt in this session. Ardy also confirmed Phase 0–6
complete across the target devices and live at `quiz.parenteers.id`; Phase 7 remains on hold.

**2026-08-23, PDF illustration care Batches 2–3 completed without visual QA.**
Generated and saved the remaining fifteen parent-care tiles, bringing `images/pdf-art/care/` to
25/25 source PNGs. Per Ardy's token-saving instruction, visual QA was skipped; only exact filenames
and dimensions were checked. All 25 care files are exactly 1024×768. Batch 4 (play tiles) is next.

**2026-08-23, PDF illustration Batch 1 completed; manual visual QA deferred.**
Generated and saved all ten Batch 1 parent-care source PNGs under `images/pdf-art/care/`. Replaced
`p-brain-dump.png` and `c-say-dont-know.png` with revised abstract-mark versions, then verified all
ten files are exactly 1024×768. Per Ardy's instruction, no further visual QA was performed; Ardy
will review manually. Batch 2 has not started.

**2026-08-22 (latest), Current PDF ownership and audio default reconciled.**
Ardy clarified two decisions. First, the PDF is already built and stays usable with placeholder art;
the next pass is an illustration revision. Ardy will provide the exact generation prompt, then GPT
creates all 54 images in the primary session before the derivative and 32-PDF rebuild. Updated the
Phase 8 plan, art contract, data spec, current status and blocker wording; the earlier embedded
prompt draft is now explicitly reference-only. Also removed the stale 14/15-page, 53-image and PDF
dock claims from current-status surfaces. Historical session entries below remain unchanged as a
record of what was believed at the time.

Second, fresh visitors default to sound **on**, subject to the browser autoplay gate; a persisted
explicit off remains authoritative. Synchronized `AGENTS.md`, `CLAUDE.md` and the architecture map
with the already-correct store, tests, `plan.md` and `conventions.md`. Documentation-only except for
correcting the PDF generator's stale 14-page/53-art comments; no runtime behavior changed.
Verification: **14 test files / 168 tests**, typecheck clean, asset audit 0 issues, normalized
`AGENTS.md`/`CLAUDE.md` diff empty and `git diff --check` clean.

**2026-08-22 (later), Checklist extended, care opener rewritten, art handover written.**
Three asks after Ardy tested the booklet on a phone.

*More on "Coba minggu ini".* `types.json tryThisWeek` is validated at exactly three actions and also
drives the Result page, so rather than renegotiate that contract and author 96 new per-type strings,
added `src/data/weekly-extras.json` — 16 one-line actions, 2 per pole, each keyed to that pole's
watch-out from the research doc §3. Page 7 now leads with the three authored actions and adds four
selected by dimension letter: seven checkboxes, still personal, no change to the app.

*More on "Untuk kamu dulu".* It was one lead line and one sentence of `careForYou` on a mostly empty
page. Now two pages: page 8 carries three paragraphs arguing why the parent comes first and stating
plainly that none of the next five pages are for the child, and page 9 carries the personal read —
four `pdf.drain_{letter}` lines chosen by the reader's own code, then `careForYou`, then how to use
the five, then a parent-side permission line mirroring the child one. The drain lines are shared
per-pole copy, so it reads as written for this type without 16 bespoke passages.

The booklet is now **16 pages**; folios, the QA contract and the phase criteria were all moved with
it. 32 files regenerate with no page clipping anywhere, largest 600 KB, 18 MB total.

*Art handover.* Ardy will generate with **GPT Image 2**, so wrote `docs/personality-pdf-art-brief.md`
against what that model actually accepts rather than against my earlier guesses: `gpt-image-2`,
released 2026-04-21, standard sizes 1024×1024 / 1536×1024 / 1024×1536, **width and height each
divisible by 16**, aspect between 1:3 and 3:1, up to 10 images per request and up to 16 reference
images per call. That last one is how the style gets anchored — the brief attaches
`pcte-story.webp` and `pcte-croquembouche.webp` as references on every call instead of describing the
style from scratch. It also corrected two sizes from the plan doc that `gpt-image-2` would have
rejected outright: 1200×600 has a height not divisible by 16, so wide bands are now 1536×1024 and
slim bands 1536×768. The count is **54, not 53** — the extra furniture band is the one closing the
activity section on page 15. All 54 filenames were cross-checked against the record ids
programmatically; zero mismatches. §9 of the plan doc no longer duplicates the prompts, it points at
the brief, so there is one source of truth per topic.

Verification: **14 test files / 168 tests**, typecheck clean, all 32 booklets regenerated with the
per-page overflow assertion passing, and the two rebuilt pages read back out of the PDF to confirm
seven checkboxes and the four drain lines land in the right order.

**2026-08-22, PDF booklet built end to end (Phase 8 steps 8.1, 8.2, 8.4).**
Ardy asked to run the app and to have the Result button actually reach a PDF, with image slots left
empty until the artwork exists. All 32 booklets now generate and the button resolves.

Authored `src/data/parent-care.json` (25 records: 1 universal + 3 per pole) and
`src/data/child-activities.json` (20 records: 4 per age band, 2 per pole of that band's dimension),
both bilingual, each child record carrying a method tag, materials and a safety line. Added 24 i18n
keys in both languages and declared them in `REQUIRED_I18N_KEYS`, since the suite asserts the key set
exactly. `scripts/generate-pdf-booklets.mjs` (`npm run assets:pdf`) renders the booklet through
headless Chrome `Page.printToPDF`; the Result gained a `.result__pdf` section between the weekly
actions and the other-types row.

A `.result__pdf-dock` text link under the primary save button was built and then **removed the same
day** at Ardy's direction, along with its `result.pdf_dock` key and CSS. The docked bar is back to one
action — the save that feeds the Story — and the section is the booklet's only entry point.

Three things the build corrected against the spec, all by measuring rather than guessing:
the booklet is **15 pages, not 14** — a play card carries steps, materials, safety and method, and
three of them overflowed A4 on every type, so the child activities run 2/2/1 across pages 12–14;
embedding the existing character and story art straight from `public/` produced a **3.7 MB** file
because Skia embeds a decoded bitmap for anything it resamples, fixed by pre-encoding to JPEG at the
printed pixel size with sharp (largest file is now **585 KB**, all 32 total 17 MB); and the generator
now asserts per-page `scrollHeight` against `clientHeight` before printing, so a clipped page fails
the run instead of silently losing copy. Byte normalization of `/CreationDate`, `/ModDate` and `/ID`
was verified by generating twice and comparing md5 — identical, so rebuilds produce empty diffs.

The 53 commissioned illustrations are not in yet, per Ardy: every one of those slots renders as a
labelled dashed frame reading "Ilustrasi menyusul". The two images that already exist — the character
WebP and the story WebP — are embedded, since they are per-type and already shipped. The page-15 QR
is a reserved tile, not a drawn code.

Verification: **14 test files / 168 tests**, typecheck clean, all 32 booklets generated with **no page
clipping any content**, and a headless 390×844 touch-emulated pass on the running dev server
confirming the section sits after the weekly actions and before other-types, the link carries
`target="_blank"`, `rel="noopener"` and **no** `download` attribute, the href tracks both language and
type (`/pdf/id/pcte.pdf`, `/pdf/en/fcdn.pdf`), both fetch 200 as `application/pdf`, and horizontal
overflow is 0. Not run: `qa:phase55` (no assertions added for the new section yet) and any deploy.

**2026-08-22, Personality PDF booklet specified (Phase 8).**
Ardy asked for a downloadable PDF per personality with a button on the Result, then expanded the
scope mid-discussion: it also has to carry five self-care activities for the parent and five
activities for the child aged 0–5, be heavily illustrated, and come with image prompts for every
page. Wrote `docs/personality-pdf-plan.md` as the authoritative spec and added a Phase 8 row to
`plan.md` §13, two blockers to §15, a doc-map row, a hard invariant and three commands to
`CLAUDE.md` / `AGENTS.md` (patched together and diffed afterwards to confirm they stayed
byte-identical apart from the title). No source, no build, no deploy.

Decisions locked in the session: full profile plus both activity sections · separate ID and EN files
(32) · per-activity illustration (45 activity + 8 furniture = 53 pieces) · Claude writes the prompts
and Ardy generates them · ~1 MB per file at print quality, ≈30 MB total · the button appears both as
its own Result section and as a link in the docked share bar · a plain `href` with `target="_blank"`
and **no** `download` attribute, because Instagram's WebView silently drops `download` and `blob:`.
The child activities are written fresh rather than curated from the 30 Resep Sensory Play booklet,
at Ardy's direction, and must follow Montessori and play-therapy method.

Research done before writing any activity, since "grounded in method" was the explicit ask: filial
therapy / CPRT special play time (Bratton, Landreth & Bennett — 20–30 min weekly, child leads, no
teaching or questions, describe, reflect, encourage effort, five- and one-minute warnings, guideline
range 3–9, which is why it anchors only the 3y+ bands); Harvard's five serve-and-return steps as the
0–3 spine; Montessori sensitive periods, prepared environment, control of error, practical life and
Goldschmied's treasure basket; the AAP *Power of Play* report for why any of it matters; and CPSC
16 CFR §1501.4 (the 2.25 × 1.25 in small-parts cylinder, i.e. the toilet-paper-tube test) as the
choking baseline. All 45 activities are drafted in the spec with method tags, age bands, materials
and safety lines.

Two things this closes that were open elsewhere. Page 14 re-homes `footer.made_by`,
`footer.copyright`, `footer.disclaimer` and the "Follow @parenteers" CTA, all orphaned when `/end`
was removed on 2026-08-02. And it gives `docs/future-sensory-play-result-extension.md` a home that
cannot lengthen the Result scroll, which was the objection that parked it on 2026-08-16.

Machine note: the working copy has moved to Fedora Linux. `ffmpeg` **is** present here
(`/usr/bin/ffmpeg`), so the preloader-weight blocker recorded as "needs ffmpeg, which this project
does not carry" is no longer blocked on this box. The Brilliant design file and the WebAnimation
Library live on Windows paths and are unreachable; the 34 motion guides were already copied into
`docs/motion/`, so only exact Brilliant geometry lookups are lost. `node_modules/` is absent —
`npm install` is required before any test, build or QA run.

**2026-08-18, English "bake" replaced everywhere it was a countable noun.**
The EN copy called a result "a bake" ("Which Bake Is Your Parenting Style?", "Meet the other bakes",
"Share your bake"), which is not idiomatic English: as a countable noun a bake is a dish, not a
character. Costed the user's proposed swap to "dessert" first and rejected it, because 5 of the 16
types are not desserts (Bagel, Baguette, Pretzel, Focaccia, Milk Bread) and 2 more are borderline
(Muffin, Banana Bread), so "your parenting dessert is: The Baguette" would read worse than the
problem it fixes. Fixed instead by mirroring what the ID copy already does: the two title slots
become "Bread or Cake: What's Your Parenting Style?" (ID: "Roti atau Kue Apa?"), the inline
countable noun becomes "treat", `intro.point2` becomes "different recipes", and
`result.softsell_body` follows ID's "cocok sm gaya kamu" with "match your style". Every place where
bake is a verb ("Let's bake", "Baking your result…", "baked with love", "Boiled and baked") or the
collective "bakery" was left alone, since both are correct English.

10 EN strings, plus `id.json` `result.other_types_label` where a stray English "bake" had leaked
into an otherwise all-"kue" file, plus the Cronut watch-out in `types.json`. Both copy docs updated
to match so they stay authoritative. Copy only: the `/baking` route, the `.baking__*` classes, the
28 `qa:phase55` baking assertions, the `parenting-bakes` worker name, the UTM campaign and the
`parenting-bake-{slug}.png` share filename are internal and were left untouched. 168 tests pass.
The one layout risk was the longer landing headline; measured at 390x844 and 390x720 it renders
identically to the old string (3 lines, 36.4px, same 717px bottom edge) with no overflow. Not
visually confirmed on the result scene: the browser pane was hidden for this session, which freezes
the preloader counter before the scene mounts, so `qa:phase55` on a real machine is still worth a
pass. PAGE 18 of `quiz-01-flow-dialogue.md` still reads "Every bake rises differently"; that is
retired `/end` copy deliberately kept on record.

Deployed the same day: worker version `44085bc4-0a2a-4729-ab9b-7e5f8012b671`, 19 files uploaded
(129 already present), live on `quiz.parenteers.id` and the workers.dev endpoint. Production
returns 200 and the deployed bundle serves the new EN strings with none of the old ones left in it.
The 16 prerendered `/r/{slug}` stubs are unchanged, as expected: they carry ID metadata, and only
the EN dictionary moved.

**2026-08-17, Orchestrator docs caught up with the three shipped surfaces.**
`CLAUDE.md` and `AGENTS.md` are byte-identical apart from the title, so both got the same edit and
were diffed afterwards to confirm they stayed in sync. Added `assets:audit`, `assets:preloader` and
`deploy` to the command list, and three hard invariants that were only recorded in the phase doc:
the share card reproduces `images/Result Card.jpg` through `CARD_LAYOUT` (so the design changes
there, not via ad-hoc offsets), the preloader clip must stay faststart and must never block launch,
and the desktop gate is copy left / QR right with one breakpoint plus a short-viewport tightening.
Corrected the `/end` removal date from 2026-08-17 to 2026-08-02, which is what this log records.
Docs only; no source, no build, no deploy.

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
