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

| Step | What | Status | Commit |
|---|---|---|---|
| 0 | Homepage in the new direction, DESIGN.md, perf docs | done | `1d90f35` |
| 1 | This handoff file | done | — |
| 2 | Prop-firm compare redesign (`PropFirmCompare.tsx`) | **in progress** | — |
| 3 | Shared page chrome: `PageIntro`, detail-hero glow, card hover, button press, filter bars, tokens | todo | — |
| 4 | Apply chrome to Funded Accounts (directory + firm page + tools pages) | todo | — |
| 5 | Courses, Strategies, Learn hubs + detail pages | todo | — |
| 6 | Brokers, Tools, Signal groups (incl. removing blur from `.signal-filter-bar`) | todo | — |
| 7 | Deals, Find my firm, Calculator, Drawdown, Start here, My Hub, Sign in, Glossary | todo | — |
| 8 | Lighthouse on `/funded-accounts`, a firm page, `/strategies`; update `docs/perf-after.md` | todo | — |
| 9 | `npm run check`, commit, push (no merge) | todo | — |

Update the row and add the commit hash each time a step lands.

## Step 2 — Compare redesign: the intent

Problems with the old table: every row looked the same, numbers had no
sense of scale, column pickers were noisy, phones got a wall of text, and
an empty page gave nothing to start from.

The new one (all in `src/components/PropFirmCompare.tsx`, logic unchanged
in `src/lib/propfirm-compare.ts`):

1. **Column header = a plan card**: logo, firm, market pill, the price as
   the hero number, then the pickers in a compact 2-column grid. Remove
   button is 44px.
2. **Rows are grouped** (Price & billing · Targets · Loss limits · Rules ·
   Platforms & reviews) with a labelled divider row per group.
3. **Money rules get a bar**: daily loss, max loss and profit target show
   the amount **and** a thin bar whose length is that amount as a share of
   the account size (loss bars in the danger colour, target in success).
   It's a visual of the published rule, not a judgment — never label one
   column better.
4. **"Only show differences" toggle** dims rows where every column is the
   same, so three similar plans read at a glance. Off by default.
5. **Sticky summary strip**: once the plan cards scroll out of view a slim
   bar under the header shows each plan's name + price, so the reader
   always knows which column is which. Appears/disappears with
   opacity/transform only.
6. **Phone**: the table scrolls sideways with scroll-snap per column, the
   row-label column stays stuck on the left, and Share/Save sit in a tray
   above the bottom nav.
7. **Empty state offers three example comparisons** generated from the
   data (first three firms alphabetically that share a program — never a
   pick), plus the firm dropdown.

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
