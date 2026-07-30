# CLAUDE.md — Project Orchestrator

**Parenting Bakes** — an Awwwards-caliber, mobile-only quiz web app for Parenteers. 12 scenario questions → 1 of 16 bake-character parenting personalities → a 9:16 result built to be screenshotted into an Instagram Story. Bilingual (ID default / EN). Static site, no backend — the database is JSON files. This file routes you to everything; keep it lean and don't duplicate doc content here.

## Fresh-session protocol

1. Read **`progress.md`** — current phase, next action, blockers, session log. This is the only file that tells you *where we are*.
2. Read the current phase's section in **`plan.md` §13** and its referenced blueprint rows (**§8**).
3. Pull in `structure.md` / `conventions.md` / `data-spec.md` as the work requires (map below). Don't re-read everything every time.
4. Never re-litigate decided things: decisions live in **`plan.md` §14** (defaults apply unless the user overrides) and past context lives in the `progress.md` log.
5. **Before ending a session: update `progress.md`** (statuses + a dated log entry). This is mandatory — it's what keeps the next chat sterile.

## Doc map (single source of truth per topic)

| File | Authoritative for |
|---|---|
| `progress.md` | Current status, next action, waiting-on, session history |
| `plan.md` | Build phases + ✓ criteria, §8 moment→technique blueprint, §10 budgets, §14 open decisions, §15 user blockers |
| `structure.md` | Architecture: scene machine, GL world facade, routing, boot, share pipeline — plus the §11 recipe to clone this architecture for similar projects |
| `conventions.md` | Non-negotiable rules: interaction ground rules, motion, code, perf, a11y, copy/i18n, assets, git |
| `data-spec.md` | JSON database schemas, type registry, scoring, i18n key conventions, validation invariants, .md→JSON transcription map |
| `parenting-personality-research.md` | Science layer, the 16 types' source definitions |
| `quiz-01-flow-dialogue.md` | Page-by-page copy EN/ID (transcribe, never rewrite) |
| `quiz-02-ui-strings.md` | UI string table → i18n JSON verbatim |
| `images/README.md` | Current source-art inventory, folder roles, exact reference/opening/type order, archive boundary, and production caveats |
| `images/old images/quiz-03-image-prompts.md` | **Archived; ignore for build** — only its §5 asset naming remains relevant (mirrored in conventions.md §7) |

## Hard invariants (violating any of these is a bug)

- **Mobile-only:** ≥900px (or fine-pointer, no touch) gets the QR gate; "continue anyway" runs the app in a 390×844 phone frame.
- **ID is the default language;** EN via persisted toggle. ID copy register stays conversational (`yg`, `dr`, `tp`, `gak`) — never formalize.
- **Scoring:** majority letter per dimension over 12 questions (3 per dimension, ties impossible) → `[PF][CG][TD][EN]` code. Answer positions randomized per render; the pole travels with the answer.
- **Database = bundled JSON files** per `data-spec.md`. No backend, no accounts. Content is never hardcoded in scenes.
- **Endgame:** the story-mode screen must produce a clean screenshot in the Instagram in-app browser — that path can't depend on downloads or Web Share.
- **Taste benchmark:** `D:\#dev\WebAnimation Library` — port from its `guides/`, don't invent patterns or cite blog posts.
- **Phase 4 visual authority:** follow `images/README.md` and the ordered files in `images/Interface-Reference/`; copy/data documents still control wording.
- **Copy honesty:** "built on 4 research-backed parenting dimensions," never "science says there are 16 types." Disclaimer on result + end pages. Equal love across all 16 types.
- conventions.md §1 ground rules (Pointer Events only, `touch-action` discipline, transform/opacity-only, paired haptics, reduced-motion parity, one `gsap.ticker` clock) apply to every line of interaction code.

## WebAnimation Library workflow

The library at `D:\#dev\WebAnimation Library` holds 99 offline technique demos; `guides/<nn>-<slug>.md` are self-contained implementation briefs. Phase 0 copies exactly **34 guides** into `docs/motion/`: the 32 unique technique guides cited by plan §8, plus gesture-utility guides 59 and 60. To build any animated moment:

1. Find its row in plan.md §8 → technique number(s).
2. Read `docs/motion/<nn>-<slug>.md` (fall back to the library path if not yet copied).
3. Port the **core mechanism, not the demo chrome** — swap its dark-editorial theme for our tokens, reuse our existing Lenis/ticker/world instances, keep its reduced-motion + performance structure.

## Commands (once scaffolded — Phase 0)

```bash
npm run dev        # Vite dev server (test on phone via LAN IP)
npm run test       # scoring + data-integrity validation (data-spec.md §7)
npm run build      # static build incl. 16 prerendered /r/{slug} OG stubs
npm run preview    # production preview
```

## Working agreements

- Verify on a 390×844 viewport **and** with `prefers-reduced-motion` before calling any scene done; a phase closes only when its plan §13 ✓ criteria pass.
- Real-device surface for QA is the **Instagram in-app browser**, not just Safari/Chrome.
- Ask the user only for §15 blockers or genuine scope changes; everything else has a default.
- The 16 active source images have arrived, but placeholders remain until Phase 4 creates intentional optimized derivatives from the opaque masters.
- Session hygiene: small commits scoped by phase (`feat(scenes): …`, `data: …`), and always leave `progress.md` current.
