# Design audit — where the site drifts from DESIGN.md ("Aurora Terminal")

Written 2026-11-15 on branch `kian/design-audit-aurora`.

**How this was made:** a 10-minute pass reading `DESIGN.md`, the homepage
(`src/app/page.tsx`) and the code of every page type, searching for the
patterns DESIGN.md forbids or replaces. It is a **code audit, not a
screenshot-by-screenshot review** — items marked "(not yet seen in a
browser)" should be looked at before they are fixed.

Ordered by how much a visitor would notice. Tick items off as they are fixed.

## Progress (updated 2026-11-16)

Fixed and pushed, each checked at 375px and desktop width in dark and light:
- Strategy detail shell (all 58 pages): headings, pills, cards, walkthrough,
  long titles wrapping on phones.
- All simulators and quizzes: outer panel (the green/gold glow border).
- Sticky Visit bar and signal-group join bar: blur removed.
- Learn hub and the 9 topic pages.

Notes for whoever continues:
- All 58 strategies use `InteractiveStrategyPage.tsx`. The plain template
  `src/app/strategies/[slug]/page.tsx` currently renders **no pages**; it
  still has the old coloured headings and 36px pills — fix it or delete it.
- The hero stat strip on strategy pages was left as is: DESIGN.md's "Detail
  pages" section describes exactly that `grid-cols-3 gap-px` strip.
- `border-2` inside simulators turned out to be chart legend swatches —
  not drift, leave them.
- `.sg-search` blur is on a search box that is not sticky — allowed.
- The step-open animation in `StrategyWalkthrough` / `CourseCurriculum`
  still animates `grid-template-rows` (a height animation, motion rule 1);
  it now switches off for reduced motion but should become native
  `<details>`.
- Everything not ticked below is still outstanding.

Note: `docs/ROLLOUT.md` says "Strategies: do not touch" (2026-11-11). The
founder's brief for this branch (2026-11-15) replaces that: strategy pages
go first.

---

## 1. Strategy detail pages (58 pages) — worst drift

Files: `src/components/InteractiveStrategyPage.tsx` (shared shell of the
interactive pages), `src/app/strategies/[slug]/page.tsx` (plain template),
`src/components/StrategyWalkthrough.tsx`, `src/components/WrittenQuiz.tsx`,
`src/components/MarkDoneButton.tsx`, and the ~55 `*Simulator.tsx` /
`*Quiz.tsx` widgets.

- [x] **Green heading.** "Step by step: how to actually trade this" is
  rendered with `tone="success"`, which colours the heading text *and* its
  icon green. "Market conditions" is amber the same way. DESIGN.md: status
  colours are "status only, never decoration". Fix: section headings are
  always white text with a gold `icon-chip`. (Both files, `SectionHeading`
  + `TONE_TEXT_CLASS`.)
- [x] **Green decoration elsewhere:** the "see the full step-by-step
  walkthrough" link is green; the "See it happen, live" heading icon is
  green; the "In-depth guide" badge is `badge-success`; `WrittenQuiz` has a
  green outer border before anything is answered. None of these mean
  "gain/correct". (Green on a *correct answer*, a *ticked step*, "Works
  best" and buy/entry markers is meaning and stays.)
- [x] **Type scale.** Section headings are hand-sized `text-3xl sm:text-4xl`
  (30–36px, bigger than on any other detail page) with inline
  `fontFamily` instead of the `section-title` utility. The plain template
  uses a third size (`text-2xl sm:text-3xl`) and sets the definition in
  24–30px italics.
- [x] **Icon chips** are 48px squares; the kit `icon-chip` is 32px.
- [x] **Cards** use the old shell (`rounded-xl border border-border
  bg-surface`) with `hover:shadow-glow` on plain, non-clickable text boxes
  — they light up like buttons but do nothing. Should be `kit-panel`, no
  hover on static content.
- [x] **Quick-nav pills** use `border-2`, `font-bold`, `transition-all` and
  a hover glow (animates box-shadow — breaks motion rule 1). On the plain
  template the pills are only 36px tall (`min-h-9`) — under the 44px tap
  target.
- [ ] **Hero stat strip** hand-built (`grid grid-cols-3 gap-px bg-border`)
  with sans figures; kit is `stat-strip` / `stat-cell` / `stat-value`.
- [x] **Walkthrough progress bar** animates `width` with `transition-all
  duration-300` (motion rule 1 + hard-coded duration).
- [ ] **Simulators and quizzes** (~110 files): `border-2` panels in ~12 of
  them, old card shell, mixed heading sizes. Chart colours for buy/sell,
  entry/stop are meaning and stay. (not yet seen in a browser — check each
  family before changing)

## 2. Strategies directory — `/strategies`

Files: `src/app/strategies/page.tsx`, `src/components/StrategyDirectory.tsx`

- [ ] Already uses kit classes in places; inline `fontFamily` on the page
  heading; check cards against the `listing-card` recipe. (not yet seen in
  a browser)

## 3. Blur on sticky / fixed elements (motion rule 2)

- [x] `src/components/StickyVisitBar.tsx` — `backdrop-blur-md` on the bar
  that sticks to the bottom of every firm / course / tool / broker page.
  Fix: 97%-opaque surface.
- [x] `src/components/SignalGroupStage.tsx:883` — `.sg-joinbar` has
  `backdrop-blur-md` and is pinned to the bottom of the group panel.
- [ ] `src/app/globals.css` `.sg-search` — `backdrop-filter: blur(16px)`
  (check whether the search bar is sticky; if so remove).
- OK as is: `SearchDialog`, `AgeConfirmModal`, `.sg-backdrop` (static
  dialog overlays — allowed).

## 4. Learn hub and the 9 topic pages

Files: `src/app/learn/page.tsx`, `src/components/learn/LearnPageShell.tsx`,
`src/components/learn/SectionHeading.tsx`, other `src/components/learn/*`

- [x] Quick-nav pills: same `border-2` / `font-bold` / `transition-all`
  problem as strategies (`LearnPageShell.tsx:60`).
- [x] `section-title` overridden to `text-2xl sm:text-3xl` (hub and
  `SectionHeading.tsx`) — off the type scale.
- [x] Old card shell in `LearnPageShell`, `MiniQuiz`, `DefinitionGrid`,
  `ComparisonTable`, `CandlestickDiagram`; `LeverageMarginExplainer` uses
  `transition-all`.
- [ ] Topic pages don't use `PageIntro` (they have their own shell).

## 5. Signal groups — `/signal-groups`, `/signal-groups/<slug>`

Files: `src/components/SignalGroupStage.tsx`, `SignalGroupDetail.tsx`,
`SignalGroupsIntro.tsx`, `.sg-*` in `globals.css`

- [ ] 7 raw hex colours in `SignalGroupStage.tsx` (DESIGN.md: "never raw
  hex in components").
- [ ] Five hand-sized `text-3xl+` headings and 3 inline `fontFamily`s.
- [ ] Own card system (`.sg-card`, `.sg-tile`) with per-group ink colours —
  a second accent besides gold. Decide: keep as this section's identity or
  bring back to gold. (creative, needs a founder's eye)
- [ ] Hard-coded `200ms ease` transitions in `.sg-*` CSS.

## 6. Brokers — `/brokers`, `/brokers/<id>`, stocks, crypto

Files: `src/app/brokers/**/page.tsx`, `src/components/BrokerDirectory.tsx`,
`BrokerProfile.tsx`, `BrokerAccordion.tsx`, `BrokerCategoryEmpty.tsx`,
`BrokersBrowse.tsx`

- [ ] None of the four broker pages use `PageIntro` / `page-title`.
- [ ] Old card shell; hard-coded `duration-*` (4 in `BrokerDirectory`, 2 in
  `BrokerAccordion`); `BrokerAccordion` is React state where DESIGN.md asks
  for native `<details>`.
- [ ] `BrokerCategoryEmpty` — hand-sized heading; check against the
  empty-state pattern.

## 7. Tools — `/tools`, `/tools/<slug>`

Files: `src/components/ToolDirectory.tsx`, `src/app/tools/[slug]/page.tsx`

- [ ] Old card shell (4 on the detail page), no `listing-card`, no
  `stat-strip`; hard-coded durations in the directory.

## 8. Courses — detail and compare

Files: `src/components/CourseDetail.tsx`, `src/app/courses/[id]/page.tsx`,
`src/app/courses/[id]/[subcourse]/page.tsx`, `CourseCompare.tsx`,
`CoursePricing.tsx`, `CourseCurriculum.tsx`

- [ ] Detail page: old card shell ×4+2, no kit panels.
- [ ] Compare: still the sideways-scrolling table; prop-firm compare moved
  to v2 (no sideways scroll). Uses success/danger outside badges — check.
- [ ] Sub-course page has no `PageIntro`/`page-title`.
- [ ] Directory: one control under 44px (`CourseDirectory.tsx`).

## 9. Funded-accounts tools

- [ ] `src/components/PropFirmPricing.tsx` — Market / Challenge-type
  pickers are solid gold buttons; should be `.seg` / `.seg-btn`
  (ROLLOUT step 8).
- [ ] `src/components/FirmMatcher.tsx` (find-my-firm) — old card shell ×2,
  2 controls under 44px.
- [ ] `src/components/ChallengeCostCalculator.tsx` — old card shell ×3,
  hand-sized heading, success colour use to check.
- [ ] `src/components/DrawdownSimulator.tsx` — inline `fontFamily`, one
  control under 44px.
- [ ] `src/components/RulesInMoney.tsx`, `PropFirmReviews.tsx` — one
  control under 44px each.

## 10. Start here, My Hub, sign-in, deals, glossary, privacy

- [ ] `src/components/StartHerePath.tsx` — old card shell ×2; green use to
  check (done ticks are fine).
- [ ] `src/components/MyHub.tsx` — mostly on the kit; 2 controls under 44px.
- [ ] `src/components/auth/AuthPanel.tsx` — one raw hex (probably the
  Google logo, which is allowed — confirm).
- [ ] `src/app/welcome/password/page.tsx` — no `PageIntro`/`page-title`.
- [ ] Deals, glossary, privacy, disclaimer — use `PageIntro`; nothing found
  in code. (not yet seen in a browser)

## 11. Site-wide, low visibility

- [ ] ~80 hard-coded durations/easings in `globals.css` and `duration-*`
  utilities in ~12 components → `--dur-*` / `--ease-*` (DESIGN.md §6.2).
- [ ] `PlatformPill.tsx`, `PartnerFirmPill.tsx` — `transition-all`.
- [ ] `src/components/Skeletons.tsx` — skeletons still draw the old card
  shell, so loading states won't match migrated pages.
- [ ] Homepage (`src/app/page.tsx`) is the reference; 3 inline `fontFamily`
  and 7 hand sizes are part of the hero design — leave.

---

## Still to verify in a browser for every fixed page

375px and desktop, dark and light; `document.documentElement.scrollWidth
=== clientWidth`; keyboard focus visible; reduced motion still.
