# Performance before the UI overhaul

Measured on 2026-11-11 on branch `kian/ui-overhaul` **before any changes**
(identical to `main` at `050c789`, which already includes the site-upgrade
PR #86). Production build (`next build` + `next start`) on a laptop,
Lighthouse 13.6 CLI, mobile preset, simulated throttling (Moto G-class CPU,
slow 4G). Scores vary a few points run to run; the shape is what matters.

| Page | Performance | LCP | TBT | CLS | FCP | Speed Index | JS transferred | Page weight |
|---|---|---|---|---|---|---|---|---|
| `/` (homepage) | **62** | 1.1 s | **9,900 ms** | 0 | 1.1 s | 8.6 s | 309 KB | 716 KB |
| `/funded-accounts` | **42** | 5.6 s | **7,860 ms** | 0 | 2.0 s | 6.4 s | 330 KB | 900 KB |
| `/funded-accounts/ftmo` | 69 | 5.0 s | 500 ms | 0 | 1.1 s | 2.1 s | 315 KB | 721 KB |
| `/strategies` | 68 | 1.6 s | 3,320 ms | 0 | 1.6 s | 3.7 s | 313 KB | 797 KB |

## What the numbers say, in plain English

- **The homepage's problem is JavaScript work, not download size.** The page
  paints quickly (LCP 1.1 s) but then the phone is frozen for almost ten
  seconds (TBT 9.9 s) while it boots the WebGL terrain (`three`,
  `@react-three/fiber`, `postprocessing`) and the scroll choreography
  (`gsap`). On a real mid-range phone that is the "page looks ready but
  won't respond to taps" feeling.
- **`/funded-accounts` is slow for a different reason**: the directory ships
  every firm's full pricing data to the browser so the filters work
  client-side, and hydrating 29 cards plus the compare/country/search
  controls costs ~8 s of main-thread time. Its LCP (5.6 s) is the card grid
  waiting on that work. That page is **out of scope for this design branch**
  (homepage only) and is noted here for the rollout.
- Firm pages and Strategies are closer to acceptable; their shared cost is
  the site-wide JS every page carries (header, search, auth provider,
  bottom nav), ~310 KB transferred.
- CLS is 0 everywhere — nothing jumps. Keep it that way.

## Budget for the overhaul (from the brief)

Homepage, Lighthouse mobile: **Performance ≥ 90, LCP < 2.5 s, TBT < 200 ms,
CLS ≈ 0, homepage JS noticeably smaller than 309 KB.** No WebGL, no
animation libraries, transform/opacity-only animation, no backdrop blur on
sticky chrome, nothing animating off-screen.

Raw Lighthouse JSON for these runs was kept outside the repo (they are
~1 MB each); re-run with:

```
npx next build && npx next start -p 3001
npx lighthouse http://localhost:3001/ --preset=perf --form-factor=mobile \
  --screenEmulation.mobile --throttling-method=simulate \
  --only-categories=performance --output=html --output-path=./lh-home.html \
  --chrome-flags="--headless=new"
```
