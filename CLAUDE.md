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
| Funded accounts (prop firms) | `/funded-accounts` | **live** — FTMO, Alpha Funded |
| Courses | `/courses` | **live** — Six Figure Capital |
| Signal groups | `/signal-groups` | next up |
| Brokers | `/brokers` | coming soon |
| Tools | `/tools` | coming soon |
| Strategies | `/strategies` | coming soon — build LAST, most carefully |

Do not build ahead into later sections unless we explicitly ask. New sections
should reuse the existing pattern: JSON data files in the repo root → a loader
in `src/lib/` → a directory page with filters → a detail page per listing.

## How listing data works (no database yet)
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
- Not set up yet (don't add without asking): Supabase (database/auth), Stripe
  (payments, only for the strategies paywall later), analytics, email tool.
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
