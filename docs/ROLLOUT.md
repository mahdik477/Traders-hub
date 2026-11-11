# Aurora Terminal rollout — live handoff file

**Read this first if you're a model picking this work up mid-way.** It is
kept current after every commit on branch `kian/ui-overhaul`. The design
source of truth is `DESIGN.md`; this file is the *status* and the *recipe*.

Rules that still apply (from the brief and CLAUDE.md): no listing data
(JSON) changes; no wording changes about firms, ratings or warnings; no
performance/win-rate/"best" claims; payout-complaint warnings and
"not advice" notes stay exactly where they are; keyboard, reduced-motion
and 44px tap targets; animate only transform/opacity; no backdrop blur on
sticky elements; nothing animates off-screen. Don't merge anything.

## Status board

Updated 2026-11-11. "Creative" = needs design judgment; "mechanical" = follow
the recipe below, any model can do it.

| Step | What | Status |
|---|---|---|
| 0 | Homepage, DESIGN.md, perf docs | done (`1d90f35`) |
| 2 | Compare v1 (table) | done (`78599f4`), **replaced by v2 below** |
| 2b | **Compare v2** — plan cards + one fit-to-screen grid, hints, shared-scale bars (`PropFirmCompare.tsx`, `.cmp-*`) | done, uncommitted |
| 3 | Shared chrome: `PageIntro` on every page, **interior kit** in `globals.css` (`kit-panel`, `listing-card`, `stat-strip`, `seg`, `seg-toggle`, `btn-soft`, `readout`, `icon-chip`) | done, uncommitted |
| 4a | Funded Accounts directory — market switch, lit filter panel, new firm card (`PropFirmDirectory.tsx`) | done, uncommitted |
| 4b | Firm page — hero stat strip, two-column About/Reviews + "Next steps" aside (`funded-accounts/[firm]/page.tsx`) | done, uncommitted |
| 5a | Courses directory card + filter panel (`CourseDirectory.tsx`) | done, uncommitted |
| 5b | Course detail (`CourseDetail.tsx`), course compare (`CourseCompare.tsx`) | **todo — mechanical** |
| 5c | Learn hub + topic pages | **todo — mechanical** (cards already get the lit edge via `.lift-card.bg-surface`) |
| 6 | Tools directory/detail, Brokers, Signal groups | **todo — mechanical** |
| 7 | Deals, Find my firm, Calculator, Drawdown, Start here, My Hub, Sign in, Glossary | **todo — mechanical** (all already have `PageIntro`) |
| 8 | Firm pricing table (`PropFirmPricing.tsx`): the Market / Challenge-type pickers still use solid gold buttons | **todo — mechanical**: swap to `.seg` / `.seg-btn` |
| 9 | Phone (375px) + light-mode pass on every touched page; Lighthouse; `docs/perf-after.md` | todo |
| 10 | `/ship` (compliance + code reviewers), commit, push — no merge | todo |

**Strategies: do not touch** (founder's instruction, 2026-11-11). The only
change there is `src/app/strategies/page.tsx` using `PageIntro` like every
other hub; leave the directory, detail pages, simulators and quizzes alone.

**Needs a compliance read before the PR** (new wording, all in
`PropFirmCompare.tsx` → `buildGroups()` `hint:` strings): one plain-English
line per compare row, e.g. "Lose more than this in a single day and the
account is closed." Also the bars are now scaled against the other columns
(largest share of account fills the bar) — a picture of published rules,
never labelled better/worse.

## Recipe for the mechanical steps

Look at `PropFirmDirectory.tsx` (card) and `CourseDirectory.tsx` (card) —
they are the two references. For each remaining directory/detail:

1. **Card shell**: replace `rounded-xl border border-border bg-surface`
   with `kit-panel listing-card` (keep `lift-card`, keep `p-5`). Remove any
   solid `h-1 … bg-gradient-to-r` top bar — `listing-card` draws the
   hairline. Add `is-selected` when the card is in a compare set. Link
   overlay: `card-stretch rounded-2xl`.
2. **Card anatomy**: logo + name + pills in one row with the Save icon at
   top right (`relative z-10 -mr-1.5 -mt-1.5`); warnings/labels directly
   under; then `mt-auto pt-5` footer so cards in a row line up: `eyebrow`
   + `figure-lg text-accent` price, a `stat-strip` of 2–3 `stat-cell`s
   (`eyebrow` label + `stat-value`), then the button row.
3. **Buttons in repeated cards**: `btn btn-soft flex-1` + "→" for the main
   link, and the compare toggle as `btn` with "+ Compare" / "✓ Comparing".
   `btn-primary` is only for the one main action of a page or panel.
4. **Filters**: the first/most-used choice becomes a `.seg` with
   `.seg-btn[aria-pressed]` and `.seg-count`; the rest sit in a
   `kit-panel` form, `grid-cols-2` on phones. Result count in `readout`.
5. **Panels on detail pages**: `kit-panel p-5 sm:p-6`; section labels in
   `readout`; facts in `stat-strip`; link lists as `.firm-step` rows with
   an `icon-chip`.
6. Never put a Tailwind utility for the same property on a kit class
   (kit classes are plain CSS and win over utilities).
7. Don't change wording about firms, ratings, warnings, "Our choice",
   "Sponsored" or "not advice"; don't touch data files.
8. After each page: `npx tsc --noEmit`, look at it at 375px and desktop
   in light and dark, then `npm run check`.

Phone preview without resizing the window: on any localhost page, append a
fixed full-screen `<div>` holding 375px-wide `<iframe>`s of the pages you
want, then screenshot.

## Step 2b — Compare v2: the intent

v1 was a wide table that scrolled sideways, with columns of unequal width,
bars too short to read and pickers squeezed into the header. v2 (all in
`src/components/PropFirmCompare.tsx`; logic unchanged in
`src/lib/propfirm-compare.ts`; styles `.cmp-*` in `globals.css`):

1. **Step 1 "Your plans"** — one `kit-panel` card per plan: logo, firm,
   price as the hero number, full-size pickers. Stacked on phones, in
   columns that line up with the grid from 48rem.
2. **Step 2 "Side by side"** — a CSS grid with ARIA table roles, equal
   columns, never wider than the screen. On phones each row's label and
   hint take their own line above the values.
3. **Column names stick** under the site header (`.cmp-head`; its `top`
   is measured from `.site-header` in an effect).
4. **Every row has a plain-English hint** under its label.
5. **Bars share one scale per row**: each plan's amount as a share of its
   account, with the largest share in the row filling the bar. Loss limits
   use the danger colour, targets gold.
6. "Only show differences" pill, "same for all" tag, example comparisons
   in the empty state, Share + Save under the grid (no fixed tray).

Compliance notes kept: the review-alert row, "not a ranking" copy, dashes
for "not stated", no sorting by any metric.

## Step 3 — Shared chrome recipe (apply, don't reinvent)

- `src/components/PageIntro.tsx` (new): eyebrow · `page-title` · lede ·
  optional right-hand slot (TerminalStatPanel / actions). Static gold
  `page-glow` wash behind it — no animation (one weather layer per site).
- `detail-hero`: gets the grid texture + glow already used by
  `terminal-panel`, consistent radius `--radius-lg`.
- `lift-card`: unchanged hover; add `:active { transform: scale(.99) }`
  for buttons (`btn`) under motion-safe.
- Filter bars (`PropFirmDirectory`, `CourseDirectory`, `StrategyDirectory`,
  `BrokerDirectory`, `ToolDirectory`, signal groups): same card, same
  `field`s, chips with 44px; `.signal-filter-bar` loses `backdrop-filter`.
- Durations/easings → `--dur-*` / `--ease-*` tokens.

## How to continue

1. `git log --oneline main..HEAD` to see what landed; read the last entry
   of this status board.
2. Run `npm run dev`, open the page you're touching at 375px and desktop,
   light + dark.
3. Finish the step, `npm run check`, commit with a plain-English message,
   update this board, push to `origin kian/ui-overhaul`.
