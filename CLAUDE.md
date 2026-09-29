# Project: [Name TBD] — Trading Comparison & Affiliate Hub

## What this is
A UAE-based web platform that helps traders discover and compare trading-related
products and services across several categories. We are NOT a broker, NOT a signal
provider, and NOT giving financial advice — we are a discovery/comparison layer that
earns revenue mainly through affiliate commissions and sponsored placements.

## Business model
- Primary revenue: affiliate/referral commissions from prop firms, brokers, course
  creators, and trading tools when users sign up through our tracked links.
- Secondary revenue: sponsored/featured listing placements, a cut of paid signal
  group subscriptions, and (later) a paywalled trading strategies section.
- We do NOT claim to verify trading performance, accuracy, or win rates anywhere
  on the site. See "Non-negotiable constraints" below.

## Full product vision (7 sections — see "Current build phase" for what's active now)
1. Funded accounts (prop firms) — directory of firms we're affiliated with:
   fee, account size, drawdown rules, profit split, platform, evaluation steps.
2. Homepage / about — what we are, what we do, and our discovery-not-verification
   disclaimer.
3. Signal groups — Telegram groups (free or one-time paid), organized by pair
   traded and platform, not by any performance claim. Must pass a vetting checklist
   before listing (see constraints).
4. Broker affiliate programs — retail broker directory (separate from prop firms —
   for people trading their own capital), filterable by regulatory status, minimum
   deposit, platforms supported.
5. Trading strategies — freemium: some free, backtested strategies behind a
   paywall/membership. Highest-risk section — see constraints below before building
   anything here.
6. Tool affiliates — charting/analysis tools (e.g. TradingView), strategy-building
   and coding tools.
7. Courses — trading education, affiliate commission per sale.

Cross-cutting: filters (cost, pair traded, customer reviews, regulatory status where
relevant), rankings where they make sense (not forced on categories like courses
where content is too varied to rank cleanly), and a consistent "meets our listing
criteria" vetting badge across all categories.

## Current build phase
We are building incrementally, NOT all 7 sections at once. Current order:
1. Skeleton site (homepage/nav, other sections as "coming soon")
2. Funded accounts / prop firms — this is the active section to build now
3. Courses (reuse the listing/filter pattern from prop firms)
4. Signal groups
5. Broker affiliate programs
6. Reviews, comparison pages
7. Trading strategies paywall — build this LAST, most carefully

Do not build ahead into later phases unless explicitly asked.

## Non-negotiable constraints
- Never display or imply a performance, accuracy, or "win rate" score for any
  signal group, strategy, or account. We are a directory, not a verifier.
- Trading strategies section: any backtest results must be labeled explicitly
  as historical/hypothetical, with disclaimer language that past backtest
  performance does not indicate future results. Never use "profitable" as a
  headline claim.
- Signal group listings must pass a vetting checklist before going live: no
  guaranteed-return language, no pressure to deposit more, must offer a free tier
  or trial.
- Every page should carry (directly or via footer link) a disclaimer that this
  platform does not verify trading performance and is for discovery/informational
  purposes only.
- We collect only email addresses from users at this stage — no other personal
  data. Any signup form needs an unticked opt-in checkbox and must state clearly
  what the email will be used for. Any marketing email needs a working unsubscribe
  link.

## Tech stack
- Next.js (frontend + API routes)
- Supabase (database + auth) — use its dashboard for manually adding/editing
  listings rather than building a custom admin panel for now
- Vercel (hosting, auto-deploy from GitHub)
- Stripe (payments) — not needed until the strategies paywall phase

## Team context — how to work with us
- Non-technical team; we cannot read or debug code ourselves.
- Explain what you're about to do in plain English before making changes.
- Work in small, specific increments — one feature at a time, not the whole app
  in one pass.
- Flag clearly if something touches payments, user data, or security — we want
  to test those extra carefully before treating them as live.
