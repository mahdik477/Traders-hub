# Performance after the UI overhaul (homepage only)

Same method as `perf-before.md`: production build, Lighthouse 13.6 CLI,
mobile preset, simulated throttling, same laptop, same day (2026-11-11).
The homepage figure is the **median of three warm runs**; the other pages
are single runs. Only the homepage was redesigned — the other three pages
changed only through the shared header/layout and the lighter site-wide
JavaScript.

| Page | Performance | LCP | TBT | CLS | FCP | Speed Index | JS transferred | Page weight |
|---|---|---|---|---|---|---|---|---|
| `/` (homepage) | **84** (was 62) | **1.2 s** (1.1) | **640 ms** (9,900) | 0 (0) | 1.2 s | 1.8 s (8.6) | **199 KB** (309) | 492 KB (716) |
| `/funded-accounts` | 73 (42) | 3.8 s (5.6) | 630 ms (7,860) | 0 | 1.4 s | 1.6 s (6.4) | 216 KB (330) | 670 KB (900) |
| `/funded-accounts/ftmo` | 84 (69) | 3.5 s (5.0) | 300 ms (500) | 0.05 (0) | 1.2 s | 1.2 s (2.1) | 202 KB (315) | 490 KB (721) |
| `/strategies` | 71 (68) | 3.7 s (1.6)* | 700 ms (3,320) | 0 | 1.5 s | 1.9 s (3.7) | 200 KB (313) | 567 KB (797) |

\* Strategies' LCP element moved (the hero stat panel now counts); its
blocking time fell by 2.6 s.

## Against the budget

| Budget | Result | Met? |
|---|---|---|
| Performance ≥ 90 | 84 (runs ranged 81–85 when the machine was quiet) | **Not yet** |
| LCP < 2.5 s | 1.2 s | Yes |
| TBT < 200 ms | ~640 ms | **Not yet** |
| CLS ≈ 0 | 0 | Yes |
| Homepage JS noticeably smaller | 309 KB → 199 KB (−36%) | Yes |
| No WebGL / animation libraries | `three`, `@react-three/*`, `postprocessing`, `gsap` uninstalled; `node_modules` lost ~1.8 MB of client code | Yes |
| transform/opacity only, no sticky blur, nothing animating off-screen | See DESIGN.md → Motion rules; header and bottom nav blur removed; hero pauses off-screen | Yes |

## What changed, and what each change bought

1. **Removed the WebGL hero and gsap scroll choreography.** This alone took
   the homepage from 9.9 s of blocking time to about 0.5 s and is where
   almost all of the win comes from. The new hero (`AuroraHero.tsx`) is
   three CSS gradients, one SVG line and a word-reveal — no JavaScript
   beyond a 10-line observer that pauses it when scrolled past.
2. **Supabase loads on demand** (`src/lib/supabase/client.ts`). The ~70 KB
   account library used to ship on every page even with accounts switched
   off; now it is never downloaded unless the environment variables exist,
   and even then only after the page is interactive. Every page lost
   ~70 KB of JS.
3. **FAQ is native `<details>`** (`FaqDetails.tsx`), the search dialog is
   code-split (`SearchDialog.tsx`, prefetched on hover), the old
   `PageTransition` wrapper is gone in favour of the browser's View
   Transitions, and Fraunces (a 4th web font) was dropped.
4. **Sticky header and bottom nav no longer use backdrop blur**; below-the-
   fold sections use `content-visibility: auto`; scroll reveals run as CSS
   scroll-driven animations where supported.

## Why it isn't 90 yet, honestly

With the 3D stack gone, the homepage's remaining main-thread time is split
roughly evenly between (a) parsing the HTML and its inline data, (b) React
hydrating the page, and (c) style/layout — each about 1 s under
Lighthouse's 4× CPU slowdown. Two caveats about the number itself:

- **This laptop is a noisy test bench.** The same build scored anywhere from
  70 to 87 depending on what else was running; "unattributable" long tasks
  of 200–800 ms showed up even on pages that hadn't changed. The medians
  above were taken with the dev server and browser closed. The Vercel
  preview measured with PageSpeed Insights (a clean machine) is the
  number to trust before merging; expect it to be higher than this.
- **The floor is the framework.** React + the Next.js app-router runtime are
  ~115 KB of the 199 KB and most of the hydration time. Our own homepage
  code is now small (the search button, the hero observer, seven hover
  rows, a stat count-up).

## What would close the gap (for the rollout)

In the order I'd try them, each measured separately:

1. **Shrink the "Everything we offer" section's serialized tree.** It is 526
   of the page's 814 elements and ~51 KB of markup, duplicated again in the
   inline page data React hydrates from. Rendering the three snapshot rows
   per section as plain text links (no logo tiles) and simplifying the
   mini-charts would cut both parse and hydrate time.
2. **Drop Geist Mono** and use Space Grotesk with `tabular-nums` for numbers
   — one fewer font file and one fewer full relayout on arrival.
3. **Move `SpotlightRow`'s pointer tracking to a single document-level
   listener** so the seven rows are server components (less to hydrate).
4. **Trim the inline page data**: shorter class lists on the repeated row
   markup, or render the FAQ answers from a static list rather than props.
5. If still short: defer the hero's non-essential client pieces
   (`HeroSearchButton`'s cycling placeholder, `CountUpStat`) to after idle.

`/funded-accounts` and `/strategies` were out of scope here; their
remaining cost is hydrating 29–58 data-heavy cards with client-side
filters, and the same rollout notes apply.

## Visual checks done

- Chrome (laptop width, dark and light): hero, search box → opens the
  site-wide search dialog, hover glow/tilt on feature rows, theme toggle.
- 375 px and 412 px emulated (Lighthouse device emulation): headline wraps,
  buttons stack, stats go 2-up, nothing overflows, CLS 0.
- Reduced motion: all hero, reveal and hover motion is inside
  `prefers-reduced-motion: no-preference` blocks (verified by reading the
  CSS; not measured on a device).
