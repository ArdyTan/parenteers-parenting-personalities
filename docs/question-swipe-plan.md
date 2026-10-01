# Question rewrite and playful directional swipe

**Historical interaction plan.** Ardy's 2026-09-30 reference at
`images/Questions-sample-newlayout.jpg` supersedes the swipe/deck composition below.
The current Question scene uses only the two bottom tap buttons, with 34px page
padding, 16px progress stars, art centred and sized by the available middle-row height
with at least 12px of side bleed, and a centred prompt. Question-screen type also
responds to width and height. The
bilingual question copy, answer poles, correction path and auto-advance contract
remain current. Browser and physical Instagram WebView acceptance of this
revision are pending.

**2026-09-30 flow override:** Back can revise earlier questions while still in the
question sequence; Baking no longer shows a Q12 edit button. The detailed Baking
correction section below records the superseded implementation.

Date: 2026-09-28. Phase 9 in `plan.md`.

**Status:** all 12 ID/EN pairs and the local tap/swipe implementation are in the working tree.
Unit tests, typecheck, build and canonical Chrome browser QA pass. Physical Instagram WebView
acceptance remains pending.
Ardy requested the copy restructuring and this development plan on 2026-09-28.

## 1. Outcome and boundaries

Answer each question with one deliberate left/right swipe or one tap on a visible answer.
Save and advance automatically. Remove the per-question confirmation button.
The target is 12 answer actions instead of 24; this does not count starting the quiz or corrections.

Keep the 12 IDs, four dimensions, three questions per dimension, eight poles and 16 results.
Shorten the presentation while retaining the situations represented by existing illustrations.
No universal yes/no wording: each side names an actual parenting response. Both sides receive
equal visual weight, warmth and feedback. This is an editorial revision of the existing reflection
quiz, not evidence that the revised wording has been psychometrically validated.

The user-facing direction is playful swipe, with fully equivalent tap buttons. Directional arrows
replace prominent A/B labels. Never use like/dislike, good/bad, red/green or check/cross semantics.
The physical direction means only the answer visibly assigned to that side in this render.

## 2. Copy contract

The complete bilingual copy is maintained in `src/data/questions.json`; the matching editorial
section is `quiz-01-flow-dialogue.md`, Pages 3–14. Do not create a third question-copy registry.

| Questions | Meaning preserved | Editorial treatment |
|---|---|---|
| 1–3 | Prepared structure / flexible rhythm | Sunday plans, packing and daily schedule remain concrete situations |
| 4–6 | Parent direction / child initiative | Activity choice, clothes and cleanup; both parents stay involved |
| 7–9 | Verbal emotional response / comfort through action | Ask for the initial response, allowing both behaviors later |
| 10–12 | Encouraging exploration / a comfortable starting point | Slide, puddles and meeting children; neither side implies neglect |

All 24 answers have ID and EN text. Current maximum answer length across both languages is 49
characters; longest scenario is 69. These are editorial measurements, not proof of layout fit.
Use wrapped full text, never ellipsis. Maintain the conversational Indonesian register.

Implemented UI strings:

| Key | ID | EN |
|---|---|---|
| `quiz.select_hint` | Geser kartu ke arah pilihanmu, atau tap jawabannya. Langsung lanjut. | Swipe the card toward your choice, or tap an answer. You'll move straight on. |
| `quiz.swipe_first_hint` | Pilih yg paling sering kamu lakukan. Kalau dua-duanya, pilih yg biasanya duluan. | Pick what you usually do. If both fit, choose what you tend to do first. |
| `quiz.release_hint` | Lepas utk pilih | Release to choose |
| `quiz.previous_answer` | Jawabanmu tadi | Your previous answer |
| `a11y.answer_left` | Pilih jawaban kiri: {answer}. Langsung lanjut. | Choose the left answer: {answer}. Moves to the next screen. |
| `a11y.answer_right` | Pilih jawaban kanan: {answer}. Langsung lanjut. | Choose the right answer: {answer}. Moves to the next screen. |

`{answer}` is a new interpolation variable. Add it to the documented i18n contract and test both
languages. Update `quiz-02-ui-strings.md` and the required-key registry together. Existing
`nav.back` serves the visible Back button. Update the test's editorial-key count deliberately.
Put the first hint on the existing Intro, using its existing start action; no tutorial modal.

## 3. Composition

Keep the shared three-band shell and implemented brand tokens: header, flexible body, bottom
section. Header language/sound controls remain reachable. Question body has progress/Back/Close
and one draggable scenario composition. Bottom section holds two equal-width answer buttons,
left then right, with a short instruction below. The old Next CTA is removed.

The body card contains the scenario artwork and question. A shallow, noninteractive card silhouette
peeks underneath to suggest the next turn; it is decorative, `aria-hidden`, and carries no duplicate
heading, focus target or live next-question content. Keep answer buttons stationary while dragging
so both meanings remain readable. Use a positioned highlight layer behind the active answer;
animate its opacity rather than repeatedly animating border or background colors.

This is a scoped revision of the Phase 5.5 question composition. Reuse its inspected token values;
do not claim the new geometry came from the historical Brilliant file. Retain the existing full
390×260 artwork band at the 390 design width, its copy-over-art layering, explicit grid columns,
short-height fade and framed viewport overrides. A wrapper provides drag transforms without
resizing/cropping the source art. Verify the native art geometry after recomposition.

At 390×720, give text and the two buttons their natural height and let flexible space shrink.
Allow labels to wrap; minimum touch target is 44px, with equal height buttons. For enlarged text
or narrower screens, permit vertical scrolling instead of clipping or reducing readable type.
The whole scene must not capture horizontal drags: only the card is draggable.

## 4. Gesture and feedback contract

Start with these tunable values; finalize them from device observations, not as measured defaults:

| Parameter | Initial value |
|---|---|
| Horizontal intent | `abs(dx) >= 12px` and `abs(dx) > 1.3 * abs(dy)` |
| Distance commit | `clamp(64px, cardWidth * 0.24, 96px)` |
| Flick commit | At least `32px` displacement and recent signed speed at least `650px/s` |
| Velocity sample window | Last `100ms`, using the existing velocity tracker |
| Direction | Sign of displacement; velocity must agree for the flick shortcut |
| Card rotation | Proportional to displacement, capped at ±8° |
| Cancel return | Approximately 180–240ms, interruptible on a fresh drag |
| Answer feedback/navigation | Start immediately; next question accepts a fresh gesture within 200ms |

Distance commit is evaluated at release; crossing a threshold is only a preview. Dragging back
below threshold cancels unless the deliberate flick condition holds. Sample pointerup and let
stationary time expire velocity, so holding a card cannot trigger an old flick. Vertical intent
locks that sequence out of horizontal answering. Diagonal motion must resolve to one intent.

Normal motion: card follows the finger 1:1, with slight rotation and a next-card scale from 0.97
to 1. Preview the matching answer and show “Lepas utk pilih” only when release would commit.
On commit, give one visual pulse, paired haptic tick and existing selection sound; fling toward
the selected side and advance. Use the same feedback for tapping. Sound obeys the saved setting.
One subtle arrow cue may run on Q1, stopping on first interaction; no continuous idle wobble.

Reduced motion: same choices, thresholds and correction path; use static selection preview and
instant/brief crossfade. Disable rotation, spring overshoot, stack choreography and tutorial motion.
Sound is independent of motion preferences.

Use Pointer Events and pointer capture through `createPointerGesture`, with `touch-action: pan-y`
on the card. Preserve browser zoom; verify pinch behavior on devices. Reject secondary pointers,
non-left mouse buttons and starts on header/footer controls. `pointercancel`, lost capture,
detach, route/language changes, visibility loss and resize during a drag all cancel without saving.
Ignore starts in the outer 24px of the app frame on either side so native edge navigation has room.
Native browser behavior remains a physical-device acceptance gate.

Remove `bindAnswerGesture` from individual answer buttons and `bindBackEdgeGesture` from the
question scene. Buttons handle standard click/keyboard activation. A consumed or cancelled drag
must not create a synthetic click answer. Use drag-consumption tracking, not a blanket click
timeout that swallows a later intentional tap. Native edge-back must never save a choice.

## 5. State, routing and correction

One scene-owned state machine: `idle → tracking → dragging → committing → disposed`.
Cancellation returns to idle; snap-back is interruptible. Tap goes directly from idle to committing.
Both input paths call a single `commitAnswer(answerObject)` function.

1. Capture the randomized answer pair once for the mounted scene. Left is index 0, right index 1.
2. Synchronously lock committing before changing storage or starting animation.
3. Save exactly one `{q, pole}` through `upsertAnswer`; resolve the pole from the displayed object.
4. Trigger feedback once and navigate once to `/q/N+1`, or `/baking` after Q12.
5. Abort old handlers/tweens on unmount; completion callbacks must check scene lifetime.

The pole always travels with its text; never score A/B, left/right or a CSS class. Keep the binding
stable during dragging and spring return. A scene remount can shuffle again as the existing contract
requires. Previously selected answers are restored by pole, never by their old screen position.
On revisit, mark the saved answer and wait for an explicit tap/swipe; mounting must never advance.

Back on Q2–12 opens the previous question. Editing it replaces only that question's answer and
advances one step; retain later answers so correction does not erase the rest of the quiz. Q1 Back
returns to Intro. Reconfirming the same saved answer also advances once. Keep existing exit
confirmation and refresh/resume guards. No skip/neutral answer is introduced.

For Q12 correction, add the visible “Ubah jawaban terakhir” control to the Baking body's top area,
not a bottom band. Activating it cancels the baking timer and returns to Q12; its event must not
bubble into Baking's tap-to-skip. An explicit action wins a same-turn timer race; guard all result
navigation once and cancel pending callbacks on unmount. Re-entering Baking recalculates from all
12 current answers and starts its usual hold again. Result currently clears answers in `app.ts`;
after arriving there, use the existing Retake flow, not a promise of retained-answer editing.

Q6/Q9 checkpoint strings currently exist without a renderer. Keep `/q/6 → /q/7` and `/q/9 → /q/10`
direct. Do not add a checkpoint button or timer to this feature.

## 6. Implementation map and sequence

Use installed TypeScript, GSAP and existing gesture helpers; no new dependency, runtime or remote
asset. Read local motion guides 52 (deck), 59 (return) and 60 (velocity). Retire the question use
of 73 (edge-back). Port mechanisms, not the guides' CDN scripts, sample assets, colors or arbitrary
demo behavior; specifically, their pointercancel path must not become a commit.

| Step | Files / work | Completion gate |
|---|---|---|
| A · Copy | `src/data/questions.json`, `quiz-01-flow-dialogue.md` | 12 bilingual pairs, same IDs/dimensions/poles; existing data/scoring tests pass |
| B · Structure + tap | `src/scenes/question.ts`, `src/styles/scenes.css`, `src/styles/tokens.css`; i18n JSON + UI editorial table + `src/data/validation.ts` | Two visible directional buttons, single commit path, tap advances once, Back restores selection |
| C · Swipe | New `src/gestures/answer-swipe.ts` for decision logic; reuse `pointer.ts`, `velocity.ts`, `spring.ts`; wire scene lifecycle | Distance/flick/cancel behavior and randomized mapping verified; no edge-back conflict |
| D · Motion + final correction | `src/motion/shared.ts` only if needed, question scene, `src/scenes/calculating.ts`, scene-manager coordination if required | Input available within 200ms, one feedback event, Baking undo cancels timer, reduced-motion parity |
| E · QA + documentation | Existing tests plus focused gesture/browser tests; `scripts/qa-phase55.mjs`, `docs/phase-5-5-interface-plan.md`, `structure.md`, `data-spec.md`, `plan.md`, `progress.md` | Automated matrix and device evidence recorded; historical CTA assertions explicitly superseded |

Do B before C so touch, keyboard and accessibility all share a proven commit path. Do not rewrite
the global scene manager to build an independent persistent question deck. Inspect its existing
`await previous.exit()` behavior and `createSceneMotion` durations: a 200ms feedback tween plus
the old full scene exit is not a 200ms handoff. Prefer a question-specific exit/enter handoff.
If shared lifecycle changes are necessary, test route interruption outside the quiz as well.

During E, record the new directional label binding in `data-spec.md`; JSON shape needs no change.
Update the Phase 5.5 question spec and harness assertions together. Existing tests for two stacked
cards, selected state waiting for Next and `.question__cta` must be replaced by meaningful new
layout/behavior checks, not simply deleted. Keep the shared shell/art/short-height protections.

## 7. Verification and acceptance

### Automated checks

- Run `npm run test`, `npm run typecheck`, then `npm run build` for the implemented feature.
- Data: both languages nonempty; all 12 IDs and correct poles; all 16 result codes remain reachable.
- Gesture unit tests: just under/at thresholds, slow drag, flick, hold after motion, reversal,
  cancelled capture, vertical intent, secondary pointer, resize and stationary tap.
- State tests: both shuffle orders, double tap, pointerup plus synthetic click, tap during outgoing
  animation, back/language/unmount during commit; exactly one write/advance/feedback per answer.
- Correction: revisit saved answer, same-answer reconfirmation, replace one pole while retaining
  others, Q12→Baking→edit→Baking, timeout versus edit, refresh midway, final result recalculation.
- Browser: exercise all 12 questions in ID and EN, both left and right plus tap, and a complete
  12-action journey. Seed `sessionStorage['pb1.answers']` before deep links and assert the actual
  question ID to prevent the guard redirecting a sweep to Q1.
- Run `qa:phase55` normal and `--reduced` on the canonical Vite + Chrome 9223 setup. Extend coverage
  to 390×844, 390×720, narrow 360px, enlarged text and desktop framed mode. Check all copy, not only
  the previous Q1/Q2/Q5/Q10/Q12 sample. Confirm no clipping, accidental horizontal scroll, broken art,
  blocked controls or offscreen answers. Inspect screenshots and a local gesture recording.
- Test focus movement, Tab/Enter/Space, accessible names stating auto-advance, and screen-reader
  question announcement. Avoid announcing every drag frame; decorative previews stay hidden.

### Physical acceptance

Use Instagram's in-app browser on Samsung A55/S25 FE plus one iOS device. Check left/right intent,
native back, vertical scrolling/zoom, mis-swipes, correction, sound unlock, short browser viewport
and reduced motion. A lightweight usability pass asks the user to answer, cancel a drag and correct
one answer without coaching. Record hesitation/misunderstanding and adjust thresholds or labels.
Lower action count is guaranteed by the flow; faster completion and better usability require this
observation and must not be claimed from implementation alone.

Performance: animate transform/opacity only; reuse `gsap.ticker`, stop work when idle/hidden,
remove listeners and tweens on destroy. No WebGL or background canvas. Use `perf:probe` if the deck
introduces measurable performance/leak concerns; `perf:canvas` is required only if proposing a new
full-bleed/fixed decorative layer. Preserve bundle/performance budgets in `plan.md` §10.

If the canonical server/browser is unavailable, stop at the prescribed prerequisite gate; do not
install or substitute a runtime. Browser acceptance stays pending until available.

## 8. Delivery and rollback

Deliver copy separately from behavior, then QA/doc changes, in small phase-scoped diffs. Keep local
review outputs in ignored `artifacts/`. Do not install analytics or send recordings/logs externally.
Publishing/pushing/deploying requires explicit authorization. Record that the wording is updated
locally before calling it live. Roll back the scoped feature commits if needed; retain unrelated
work and generated PDFs. Deployment and physical acceptance are separate gates.
