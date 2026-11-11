# Tradox design system — "Aurora Terminal"

This is the reference for the UI overhaul. The **homepage** (`src/app/page.tsx`)
is built in this direction; every other page still wears the previous styling
and is to be migrated by following the patterns below. Tokens live in
`src/app/globals.css`; reference components are named with file paths.

Non-negotiables carried over from `CLAUDE.md`: no performance, win-rate or
"best" claims; payout-complaint warnings stay visible wherever a firm appears;
every page keeps the footer disclaimer; "Sponsored"/"Our choice" labels stay;
listing data files are never touched by design work.

---

## 1. The three directions we considered

**A. Trading Floor Noir** — black and champagne gold, graph-paper textures,
terminal-style numerals, chart lines everywhere. The current site, sharpened.
Familiar and on-brand, but it leans on the one gold accent for everything, so
nothing can "pop" against anything else.

**B. Paper & Ink Ledger** — warm stone paper, an editorial serif, generous
white space, gold hairlines; dark mode as deep ink. Reads as trustworthy and
calm, like a well-set magazine. Beautiful for Learn and Strategies, but it
makes a data-dense directory (29 firms × rules × prices) feel sleepy, and it
throws away the black-and-gold identity people already know.

**C. Aurora Terminal (chosen)** — keep the black-and-gold identity, but light
it: slow aurora gradients (gold plus **one** cool teal accent used only as
decoration), a faint glowing grid, lines that draw themselves, big confident
display type, mono numerals for data. Motion is "weather", not fireworks:
things drift and settle, nothing bounces for attention. It gives the "wow"
the brief asks for using only gradients, SVG and transform/opacity
animations — no WebGL, no animation library — so it is also the fastest of
the three.

Why C wins: it is the only direction that is *more* impressive than the 3D
hero it replaces **and** fits the speed budget, while keeping the brand.

---

## 2. Tokens (all in `src/app/globals.css`)

### Colour
Defined at the top of `globals.css` and switched by `data-theme` on `<html>`.
Use the semantic names (Tailwind classes `bg-surface`, `text-accent`, …),
never raw hex in components.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--color-background` | `#070708` | `#edebe6` | page |
| `--color-surface` | `#101012` | `#ffffff` | cards, panels, header |
| `--color-surface-2` | `#18181c` | `#f3f1ec` | hover, nested panels, skeletons |
| `--color-border` / `--color-border-strong` | `#2a261f` / `#433c30` | `#ddd9d0` / `#c9c4b8` | hairlines / inputs |
| `--color-foreground` / `--color-muted` / `--color-subtle` | `#f6f3ec` / `#cfc6b8` / `#b3a898` | `#141414` / `#3f3d38` / `#67645c` | text hierarchy |
| `--color-brand` (`text-accent`) | champagne gold `#e8c56a` | bronze `#734f10` | links, active states, icons |
| `--color-gold-fill` / `--color-gold-ink` | `#e0b44a` / `#161208` | `#8f6716` / `#ffffff` | primary button fill / its text (AA in both themes) |
| `--color-success` / `--color-warning` / `--color-danger` | `#3dce86` / `#e8a317` / `#ef5b56` | `#0f7a45` / `#8a5a00` / `#b42318` | status only, never decoration |
| Aurora teal (decoration only) | `#2fb7a6` at ≤40% | at ≤22% | hero blob B, nothing else |

Rule: **gold is the only accent for UI**. The teal exists purely inside the
aurora gradient so the hero has depth; it must never colour a button, badge
or chart series (it would read as a second "meaning").

### Type
- Display/headings: **Space Grotesk** (`--font-heading`) — `page-title`,
  `section-title`, `figure-lg`. Hero headline: `clamp(2.6rem, 8.5vw, 5.75rem)`,
  weight 700, tracking `-0.03em`, line-height 0.98.
- Body: **Geist Sans** (`--font-sans`), 16px, line-height 1.6.
- Numbers/data: **Geist Mono** (`--font-mono`) with `tabular-nums` — stats,
  prices in tables, promo codes, "checked" dates.
- Fraunces (the old homepage serif) was removed: one font family less to
  download, and the Grotesk already carries the display role site-wide.
- Scale utilities: `page-title`, `section-title`, `figure`, `figure-lg`,
  `meta` (13px muted), `eyebrow` (11px uppercase, letter-spaced).

### Spacing, radius, shadow, motion (new variables)
```
--space-1 … --space-16   0.25rem … 4rem (4px grid)
--radius-sm 0.5rem   inputs, chips       --radius-md 0.75rem  buttons, cards
--radius-lg 1rem     rows, panels        --radius-xl 1.5rem   hero search, dialogs
--radius-pill 9999px
--shadow-1 / --shadow-2 / --shadow-3     resting / hover / floating
--shadow-glow-color                      the gold halo (per theme) — use `shadow-glow`
--dur-fast 150ms   hover colour, pressed
--dur-base 240ms   menus, panels, page cross-fade
--dur-slow 620ms   scroll reveals, hero entrances
--ease-out  cubic-bezier(.22,1,.36,1)    everything that enters or settles
--ease-spring cubic-bezier(.34,1.56,.64,1)  tiny overshoot — confirmations only (Save pop)
```

---

## 3. Motion rules (the speed budget, as design law)

1. **Animate only `transform` and `opacity`.** Never `filter`, `box-shadow`,
   `height`, `top/left`, or `background-position`. Colour hovers may use
   `transition: color/border-color/background-color` (cheap, no layout).
2. **No `backdrop-filter` on anything sticky or fixed** (header, bottom nav,
   trays). Use a 97%-opaque surface instead (`.site-header`, `.bottom-nav`).
   Dialog overlays may blur because they are static while open.
3. **Nothing animates off-screen.** Looping animations must pause when their
   section leaves the viewport (`AuroraHero.tsx` toggles `.is-offscreen`,
   `CountUpStat.tsx` runs once). No infinite tickers.
4. **Reduced motion = still, not slower.** Every `@keyframes` and
   `transition` sits inside `@media (prefers-reduced-motion: no-preference)`;
   the still state must be the finished state (text at full opacity, line
   fully drawn).
5. **Entrances never hide content.** Elements start at ≥35% opacity or are
   revealed by scroll position, so the first paint already shows the page
   and LCP isn't delayed (see `.hero-word`).
6. **One "weather" layer per page**, maximum (the aurora on the homepage).
   Sections below use scroll reveals and hover only.
7. **No animation libraries, no WebGL.** `three`, `@react-three/*`,
   `postprocessing` and `gsap` were uninstalled on this branch. A small
   `<canvas>` is allowed only if it pauses off-screen, is static for reduced
   motion/weak devices and keeps the homepage inside the budget.
8. **Durations:** hover 150ms, UI 240ms, reveals 620ms. Staggers ≤70ms per
   item, ≤500ms total.

### Reference implementations
| Pattern | File |
|---|---|
| Aurora background, self-drawing line, off-screen pause | `src/components/hero/AuroraHero.tsx` + `.aurora-*`, `.hero-line-*` |
| Word-by-word headline | `WordReveal` in `AuroraHero.tsx` + `.hero-word` |
| Staggered entrance | `.hero-intro` + inline `animationDelay` (opacity/translate) |
| Scroll-driven reveal with fallback | `src/components/ScrollReveal.tsx` + `.scroll-reveal` (`@supports (animation-timeline: view())`) |
| Cursor glow + tilt card | `src/components/explore/SpotlightRow.tsx` + `.spotlight-row`, `.spotlight-glow` |
| Page cross-fade (View Transitions) | `<ViewTransition default="page">` in `src/app/layout.tsx` + `::view-transition-*(.page)`; header named `site-header` so it stays still |
| Number "settle in" | `src/components/CountUpStat.tsx` + `.stat-settle-in` |
| Confirmation pop | `.save-button.is-pop` (`SaveButton.tsx`) |

---

## 4. Component patterns

### Header — `src/components/SiteHeader.tsx`
Sticky, 97%-opaque `surface`, 1px bottom hairline with a faint gold inset
line. Left: 44px brand mark + letter-spaced wordmark. Right cluster: Search
pill (`SiteSearch.tsx`, shows `Ctrl K` from `md`), theme toggle (44px circle),
account control (`auth/ProfileMenu.tsx`, hidden when accounts are off).
Section nav scrolls horizontally on phones with a right-edge fade; the active
item gets `bg-gold-fill/15 text-accent`. Never blur it. It carries
`viewTransitionName: site-header` so it does not fade with page changes.

### Buttons — utilities in `globals.css`
`btn` (44px min height, `--radius-md`, 14px semibold) + one of:
- `btn-primary` — gold fill, dark ink (light mode: bronze fill, white ink).
  One per view. Icon on the left, 16px.
- `btn-outline` — strong border, foreground text; hover turns border and
  text gold. Secondary actions, "Visit site" (which also appends ↗ and
  `rel="sponsored"`, see `VisitSiteLink.tsx`).
- Text link — `text-accent underline` for inline actions ("Clear", "Remove").
- Icon button — 44×44 (`size-11`), rounded `--radius-md`, `aria-label`
  required (`SaveButton.tsx` icon variant, `ThemeToggle.tsx`).
Pressed/toggled state: `aria-pressed` + `border-accent bg-accent/12`.

### Listing cards — reference `src/components/PropFirmDirectory.tsx` (firm card)
`lift-card relative rounded-xl border border-border bg-surface p-5`,
with a top gradient hairline (`h-1 from-gold-deep to-gold-bright`) on
"featured" sections (courses, strategies). Anatomy, top to bottom:
1. Row: logo tile (`FirmBadge`, 44px, white or black tile) · name (`text-lg
   font-semibold`, the whole card is clickable through `card-stretch`) ·
   action cluster top-right (Save icon button, Compare toggle — both 44px).
2. Pills row (`pill`) for markets/categories; warning `badge badge-warning`
   ("Payout complaints in recent reviews") **always directly under the
   name**, never hidden behind a hover.
3. Key figure block: `eyebrow` label + `figure-lg text-accent` (the price or
   deposit), with a `badge-success` secondary fact on the right.
4. `meta` line (match count, checked date).
5. Primary `btn btn-primary w-full`, optional outline Visit button under it.
Hover: `lift-card` (1px rise, gold-tinted border). Cursor glow/tilt is for
feature rows, not for dense card grids.

### Detail pages — reference `src/app/funded-accounts/[firm]/page.tsx`, `src/components/CourseDetail.tsx`
- `back-link` (← Back to …) first.
- Hero panel: `detail-hero rounded-2xl border bg-surface p-6` with a soft
  gold radial in the corner, logo tile (56–96px), `page-title`, tagline in
  `text-muted`, a `pill`/`badge` row, and the action cluster on the right
  (Save label button + Visit). Under it, a 3-up stat strip
  (`grid grid-cols-3 gap-px bg-border` with `eyebrow` + value cells).
- Warning box (`PropFirmReviewAlert.tsx`) sits immediately after the title
  when a firm has a review alert.
- Sections: `section-title` with an 32px icon chip (`bg-accent/12
  text-accent`), `mt-10` between sections, `max-w-3xl` for prose.
- Long pages get a `QuickNav` pill row under the hero (`InteractiveStrategyPage.tsx`).
- Every detail page ends with the "not advice" `meta` paragraph.
- Sticky visit bar (`StickyVisitBar.tsx`) appears after 420px of scroll;
  on phones it sits above the bottom nav via `.tray-bottom`.

### Compare tables — reference `src/components/PropFirmCompare.tsx`
**Superseded for prop firms by Compare v2 (see `docs/ROLLOUT.md` → Step 2b):
no sideways scroll, plan cards on top, hints per row.** The older pattern
below still describes `CourseCompare.tsx` until it is migrated.
Horizontal scroll container (`overflow-x-auto rounded-xl border`), a
sticky first column (`sticky left-0 bg-surface`, row labels in
`text-xs text-muted`), one column per item (`min-w-[230px]`, `border-l`).
Column header = logo tile + name + the pickers (`field` selects, 40px). The
price row is highlighted (`bg-surface-2`, label in gold). Dashes (`—`) for
"not stated", `N/A` for "doesn't apply", `badge-success/danger` for yes/no.
Phone hint "Scroll sideways →" above the table. Columns enter with
`.compare-col` (translateX 8px, 260ms). Under the table: Share (copy) +
Save comparison buttons and the "not a ranking" `meta` line.

### Forms & inputs
- `field` utility: 44px, `--radius-sm`, background `background`, strong
  border, hover border `subtle`, focus ring from `:focus-visible` (2px gold
  outline, offset 2px). Label above in `eyebrow`, hint below in `text-xs
  text-subtle`. Group fields in a `rounded-xl border bg-surface p-3` card.
- Choice buttons (radio-like): `FirmMatcher.tsx` `Choices` — 64px rows,
  `role="radio"`, selected = `border-accent bg-accent/10` + filled dot.
- Chips (multi-choice / filters): 44px pills, `aria-pressed`, selected =
  `border-accent bg-accent/12`.
- Checkboxes: native, `accent-[var(--color-gold-fill)]`, label on the right,
  **unticked by default** for anything that is consent.
- Active filters appear as removable chips with ✕ (44px) under the bar.

### Picker — `src/components/Picker.tsx` (the only dropdown; never use `<select>`)
- **Closed** (`picker-trigger`): matches the homepage search box — dark
  surface, thin gold-tinted border, chevron on the right, a static 3px gold
  ring on focus/open. `variant="search"` is the tall version with a search
  icon (compare "Add a firm"); the default `field` is the 44px form control.
- **Open, desktop** (`picker-pop`): a raised card in a portal, fixed under
  the trigger (flips above when there is no room), gold hairline border,
  soft shadow, max 440px tall, thin dark scrollbar. Enters with a 150ms
  fade + 6px slide.
- **Open, phone <768px** (`picker-sheet`): bottom sheet with grab handle,
  title, close button, sticky search, 52px rows, dimmed (never blurred)
  background, page scroll locked.
- **Rows** (`picker-row`): optional logo tile (`FirmBadge size="sm"`) or
  flag emoji · name · tag pills · right-aligned figure in the card numeral
  style · gold check on the chosen one. Highlight = gold tint + 3px gold bar
  on the left. `warning` shows the amber badge (payout complaints) and
  `disabledNote` dims the row with a gold check ("Added").
- Search highlights the match in gold, announces the result count, and has
  a "Clear search" empty state. Shown automatically above 8 options.
- Order is the caller's (A–Z for firms). Never add "popular" or any ranking.
- Keyboard: ↑ ↓ Home End Enter Esc Tab; focus returns to the trigger.

### Sideways rows — `src/components/EdgeFade.tsx`
Header nav and the prop-firm quick links: no scrollbar, a fade on whichever
edge has more, and the active item centred. Any `overflow-x-auto` box is
`position: relative` (base layer) so nothing inside can widen the page.

### Empty states
`rounded-xl border border-dashed border-border-strong p-10 text-center`,
one `text-muted` sentence saying what to change, one `btn btn-primary` (or
outline) that does it ("Clear filters and show everything", "Browse
firms"). Loading states use `.skeleton` bars in the real layout's shape
(`Skeletons.tsx`), never spinners.

### Disclosure (FAQ, "How to read this page")
Native `<details>`/`<summary>` — `src/components/FaqDetails.tsx`,
`PropFirmNotes.tsx`. No JavaScript: keyboard and screen-reader behaviour
come free and there is nothing to hydrate. Summary is a 56px row with the
question in `font-semibold` and a chevron that rotates via `group-open`.
First item may start `open`. Don't rebuild these as React state.

### Below-the-fold sections
Wrap each section after the first screen in `ScrollReveal` with
`className="cv-auto"` (`content-visibility: auto` + an intrinsic size), so
the browser skips style/layout/paint until it's near — this is what keeps a
long page's blocking time low. Never put it on the hero or anything that
sets the page's initial height.

### Dialogs
`SearchDialog.tsx` (opened by `SiteSearch.tsx`, loaded on demand via
`next/dynamic` and pre-fetched on hover/focus) and `auth/AgeConfirmModal.tsx`:
full-screen overlay
(`bg-background/70`, blur allowed here), panel `rounded-2xl border
border-border-strong bg-surface shadow-glow`, `role="dialog" aria-modal`,
focus moved in on open and returned on close, Tab trapped, Esc closes
(except where closing would be destructive — the 18+ dialog ignores Esc),
`.search-panel` entrance (10px rise + scale .985, 220ms).

---

## 5. Interior kit (every page below the homepage)

Plain classes at the end of `globals.css`. Reference pages:
`/funded-accounts`, `/funded-accounts/compare`, `/funded-accounts/<firm>`,
`/courses`.

| Class | What it is |
|---|---|
| `kit-panel` | The lit surface: border, 1rem radius, a hair of gold on the top edge. Use for cards, filter forms, asides. |
| `listing-card` | Add to a `kit-panel` card in a grid: gold top hairline that brightens on hover/focus; `is-selected` when chosen for compare. |
| `stat-strip` / `stat-cell` / `stat-value` | A row of 2–4 facts with mono figures (add `grid-cols-N`). |
| `seg` / `seg-btn` / `seg-count` | Segmented switch for 2–4 exclusive views; state via `aria-pressed`. |
| `seg-toggle` (+ `is-on`) | A checkbox drawn as a pill. |
| `btn-soft` | Gold-tinted button for actions repeated down a grid; turns solid gold on card hover. `btn-primary` stays one-per-view. |
| `readout` | Mono uppercase caption ("STEP 1", "29 OF 29 FIRMS MATCH"). |
| `icon-chip` | 32px gold-tinted icon square for section heads and link rows. |
| `firm-step` | A 56px link row inside a "Next steps" panel. |
| `PageIntro` (component) | The top of every page: back link, eyebrow, title, lede, optional aside. |

Page rhythm: `PageIntro` → tools/notes → switch + filter panel → card grid
(`gap-4`, 1/2/3 columns) → collapsed extras. Detail pages: hero panel with
a stat strip → two columns (content left, sticky "Next steps" aside right)
→ full-width tables.

Status and the step-by-step recipe live in `docs/ROLLOUT.md`.

## 6. Rolling this out to other pages (checklist for the next model)

1. Replace any `backdrop-filter` on sticky/fixed elements with 97% surfaces
   (`.signal-filter-bar` still has one — it is not on the homepage, so it
   was left for the rollout).
2. Swap hard-coded durations/easings for `--dur-*` / `--ease-*`.
3. Give each directory hero (Learn, Strategies, Courses) the same
   `AuroraHero` treatment? **No** — rule 6: one weather layer per *site*
   entry point. Directory pages keep `TerminalStatPanel` and get scroll
   reveals + spotlight rows only.
4. Keep every card's warning badge, "Sponsored"/"Our choice" label and
   "not a ranking" copy exactly where it is.
5. Re-run Lighthouse mobile on each migrated page; the budget in
   `docs/perf-before.md` / `docs/perf-after.md` applies to all of them.
