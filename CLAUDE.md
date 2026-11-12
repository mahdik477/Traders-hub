# Traders Hub — instructions for Claude

@AGENTS.md

## What this is
Traders Hub is a UAE-based discovery site for **beginner traders**: it helps them
find and compare prop firms (funded accounts), courses, signal groups, brokers,
tools and strategies in one place. We are NOT a broker, NOT a signal provider and
NOT a financial adviser. Positioning: **discovery, not verification**. We earn
mainly from affiliate commissions, IB rebates and clearly labelled sponsored
placements.

## The team — how to work with us
- Three school-age founders (Kian, Mahdi + one more). **Non-technical**: we can't
  read or debug code. Explain what you're about to do in plain English first,
  and explain results in plain English after.
- Work in small increments — one feature per branch, not the whole app at once.
- Flag clearly (in **bold**) anything touching payments, user data, emails,
  security or legal wording, so we test it extra carefully.
- When you finish a change, tell us exactly what to look at on
  http://localhost:3000 to check it.

## Sections and build status
Section list lives in `src/lib/sections.ts` (header, homepage cards and
"coming soon" pages all read from it).

| Section | Route | Status |
|---|---|---|
| Funded accounts (prop firms) | `/funded-accounts` | **live** — 29 firms. Forex: Audacity Capital, BrightFunded, City Traders Imperium, FTMO, Funded Trading Plus, FunderPro, FundingPips, FXIFY, Goat Funded Trader, The5ers. Futures: Apex Trader Funding, Bulenox, Earn2Trade, Elite Trader Funding, Funded Futures Network, LeeLoo Trading, Lucid Trading, MyFundedFutures, Phidias, Take Profit Trader, Top One Futures, Topstep, TradeDay, Tradeify, UProfit. Both: Alpha Funded, Blue Guardian, E8 Markets, FundedNext. Firms whose recent reviews show many payout complaints carry a dated `review_alert` (warning box + card badge) instead of being left out |
| Courses | `/courses` | **live** — 29 courses: 247 Research, Ace of Trades, Bear Bull Traders, Bulls on Wall Street, Chroma Trading, Crystal Academy, EliteClouds Trading Education, Humbled Trader, Inner Circle Trader (ICT), Investors Underground, Kaizen, Miles High Club, No Nonsense Forex, Option Alpha, Owls Options Traders, PJ Trades Premium, RakeTrades, Six Figure Capital, Skylit, SMB Training, Stocks with Josh, tastylive, Team Bull Trading, The Peachy Investor, Trade Momentum, Trading Profit Path, Urban Forex, Warrior Trading, Wealth Group |
| Signal groups | `/signal-groups` | **live** — Telegram signal groups (one `signal-groups-data-<slug>.json` per group) with a detail page each |
| Brokers | `/brokers` | **live** — CFD brokers (VT Markets, PU Prime); stock brokers and crypto exchanges are empty tabs |
| Tools | `/tools` | **live** — 15 tools (charting, indicators, backtesting, journals, automation, VPS, scanners, copiers) |
| Strategies | `/strategies` | **live** — 58 strategies in one `strategies-data.json`; every one has an interactive page with a simulator and quiz |
| Learn | `/learn` | **live** — 9 hand-written beginner topics (`src/lib/learn-topics.ts`) |

Pages built around that data (not sections, so they are not in `sections.ts`):

| Page | Route | What it is |
|---|---|---|
| Site search | header button / Ctrl+K | Searches every listing, Learn topic and glossary term; index served as static JSON from `/api/search-index` (built from `src/lib/catalog.ts`) |
| Glossary | `/glossary` | Every term from `src/lib/glossary.ts` on one page |
| Compare prop firms | `/funded-accounts/compare` | Up to 3 plans side by side, shareable `?p=` link |
| Find my firm | `/funded-accounts/find-my-firm` | 5-question filter; results alphabetical, never ranked |
| Deals | `/deals` | Every active promo code/discount computed from the data, with the firm's `last_verified` date |
| Cost calculator | `/funded-accounts/cost-calculator` | Adds up fees only; activation/reset fees are typed in (they are only free text in `_notes`) |
| Drawdown explained | `/funded-accounts/drawdown-explained` | Static vs EOD vs intraday trailing on one synthetic chart, labelled an illustration |
| Start here | `/start-here` | Guided path Learn → free strategies → funded accounts, with progress ticks |
| My Hub | `/my-hub` | Profile dashboard: account card, 9-part Learn tracker, strategies being learned, "What I'm using" (self-ticked firms/brokers/courses/tools), saved listings and comparisons, alerts, recently viewed, password + account controls |
| Sign in | `/sign-in` | Google, email link or (optional) password via Supabase Auth; hidden when the env variables are missing |
| Choose a password | `/welcome/password` | Shown straight after the first email-link sign-in (optional, "Skip for now" sets the `tradox_pw_skip` cookie) and after a reset link |

The prop-firm loader also exposes raw numbers (`tier.rules`, `account.promoPrice`,
`firm.countries`, `firm.lastVerified`) for these pages — see `src/lib/propfirm-types.ts`.

Do not build ahead into later sections unless we explicitly ask. New sections
should reuse the existing pattern: JSON data files in the repo root → a loader
in `src/lib/` → a directory page with filters → a detail page per listing.

## How listing data works (listings are files; the database holds only account data)
- Every listing is one JSON file in the **repo root**, read at build time:
  - prop firms: `propfirms-data-<NAME>.json` → loaded by `src/lib/propfirms.ts`
  - courses: `courses-data-<name>.json` → loaded by `src/lib/courses.ts`
  - Adding a listing = adding a file. No code changes needed.
- Prop firm shape: firm → market (`forex` | `futures`) → program (`1-step`,
  `2-step`, `instant`, `evaluation`) → tier → accounts. Copy an existing file
  as the template.
  - Forex rules are **percentages** of account size (`"unit": "percent"`).
  - Futures rules are **fixed USD amounts** per account size (`"unit": "usd"`).
  - Prices are plain numbers: `standard` = full price, `promo` = discounted price
    (null if no promo). Each firm stays in its own currency — no conversion.
  - `null` means "not shown on the provider's page" (rendered as a dash).
    Never guess a value; leave it null.
  - Always set `_notes.last_verified` (YYYY-MM-DD) to the day the data was
    checked against the provider's live pricing page.
- `affiliate_link` empty → the "Visit site" button is hidden. That's intended.
- Logos go in `public/<section>/` and are referenced as `/<section>/file.webp`.
- **Always run `npm run check:data` after touching a data file.** (A hook also
  runs it automatically after every edit to a data file.)

## Non-negotiable constraints (legal + trust)
- Never display or imply a performance, accuracy or win-rate score for any
  signal group, strategy, firm, course or account. We are a directory.
- No guaranteed-return, risk-free, "can't lose" or get-rich wording anywhere.
- Strategies: any backtest must be labelled **historical/hypothetical**, with
  "past performance does not indicate future results". Never headline
  "profitable".
- Signal groups must pass vetting before listing: no guaranteed-return
  language, no pressure to deposit more, free tier or trial available. We index,
  we don't verify, and we must be able to delist fast.
- Every page carries the footer disclaimer (`SiteFooter.tsx`) — never remove it.
- Sponsored listings must always be visibly labelled "Sponsored".
- **Before going fully live:** get UAE legal advice on the prop firm `review_alert` warnings (UAE defamation law). Until then a red "Team reminder" shows in each warning box (`SHOW_LEGAL_REMINDER` in `src/components/PropFirmReviewAlert.tsx`); turn it off once cleared.
- Testimonials must always show their source and the "not independently
  verified" note.
- Descriptions are written **in our own words** — never copy text from a
  provider's site.
- Always write **"Alpha Funded"** (alphafunded.com). It is NOT Alpha Futures or
  Alpha Capital Group.
- Prices: full price first, discount underneath, labelled with the code where
  one exists.
- User data: email addresses only for now. Any signup form needs an
  **unticked** opt-in checkbox, says what the email is used for, and every
  marketing email needs an unsubscribe link (UAE PDPL + GDPR).

## Tech stack
- Next.js 16 (App Router) + React 19 + TypeScript, Tailwind CSS v4.
  **Read `AGENTS.md` above: this Next.js has breaking changes vs your training
  data — check `node_modules/next/dist/docs/` before using an API.**
- Hosting: Vercel, auto-deploys from GitHub; every branch gets a preview link.
- **Supabase (accounts) is in use, optionally.** `@supabase/supabase-js` +
  `@supabase/ssr`; browser-side only (no session proxy) plus one Route Handler
  at `/auth/callback`. Everything account-related hides itself when
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are
  missing. Tables + row-level security: `supabase/schema.sql`. Set-up guide for
  the team: `SETUP-ACCOUNTS.md`. Env template: `env.example` (copy to
  `.env.local`, never commit keys). Our own tables store only user id, email
  and an 18+ confirmation time (Supabase Auth's own tables also keep e.g. the
  Google profile record and, if set, the hashed password — say so in the
  privacy policy); "I'm under 18" deletes the account via the
  `delete_my_account` function; saved items/progress/alert preferences and
  "What I'm using" ticks (`my_stack`) live in the browser first
  (`src/lib/local-store.ts`) and sync to the person's own rows
  (`src/components/auth/AccountSync.tsx`). Schema changes go in
  `supabase/migrations/` as files a founder runs — never applied by Claude.
  Branded auth emails: `supabase/templates/` (pasted into the Supabase
  dashboard by a founder).
- Not set up yet (don't add without asking): Stripe (payments, only for the
  strategies paywall later), analytics, email tool. The per-firm alert opt-in
  only records a preference — nothing sends email.
- Mobile: bottom nav (`BottomNav.tsx`), installable PWA (`src/app/manifest.ts`,
  `public/icons`, no-cache `public/sw.js`), per-page `loading.tsx` skeletons.
  Share images for firms/courses/strategies come from `/api/og/...` routes.
- Styling: reuse the existing utility classes in `src/app/globals.css`
  (`page-title`, `section-title`, `meta`, `text-muted`, `container-page`, …)
  and existing components in `src/components/`. Support light + dark mode
  (`ThemeToggle`). Must work on a 375px-wide phone.

## Commands
- `npm run dev` — local preview at http://localhost:3000
- `npm run check:data` — validate every listing file (fast)
- `npm run check` — data check + lint + production build. Must pass before a PR.

## Git workflow
- Never commit to or push `main`. Each change goes on its own branch named
  `<name>/<feature>` (e.g. `kian/signal-groups`), then a pull request that a
  teammate reviews before merging.
- Before starting new work: switch to `main`, pull, then branch. (`/start` does
  this.) Before opening a PR: `/ship`.
- Commit messages: short plain-English summary of what changed for the site.

## Project skills and agents (in `.claude/`)
- `/start <feature>` — sync with main and create your branch
- `/add-prop-firm <firm>` — add a prop firm from screenshots/links
- `/add-course <course>` — add a course listing
- `/ship` — run all checks + reviews, commit, push, write the PR description
- Agents: `compliance-reviewer` (legal/trust wording), `code-reviewer`
  (bugs, mobile, accessibility, patterns). Use both before every PR.
