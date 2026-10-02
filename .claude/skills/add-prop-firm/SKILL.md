---
name: add-prop-firm
description: Add a new prop firm (or update an existing one) on the Funded Accounts page from the firm's pricing page, screenshots or links - creates propfirms-data-<NAME>.json in the right shape, leaves unknowns null, writes the description in our own words and validates it. Use whenever someone wants to add, update or re-verify a prop firm's prices or rules.
argument-hint: "[firm name or website]"
---

# Add or update a prop firm

Firm: **$ARGUMENTS**

## 1. Gather the facts (never guess)
- Best source: **screenshots** of the firm's live pricing page and "View
  rules"/FAQ pages that the person pastes in. Pricing pages are usually
  interactive, so a fetched page often misses prices. Ask for screenshots if you
  don't have them — one per market / challenge type / tier, same currency
  setting throughout.
- You may use WebFetch/WebSearch for background (founded, HQ, platforms), but
  only record what a page actually states. Anything not stated → `null`.
- Confirm you have the **right company** (e.g. Alpha Funded ≠ Alpha Futures ≠
  Alpha Capital Group). If the name is ambiguous, add a `name_note`.

## 2. Write the file
- Updating an existing firm: edit its existing file. New firm: copy the shape of
  `propfirms-data-ALPHA.json` (has forex + futures) or `propfirms-data-FTMO.json`
  (forex only) into `propfirms-data-<SHORTNAME>.json` in the repo root.
- `firm.id` = lowercase-dashes; it becomes the URL `/funded-accounts/<id>`.
- `currency` = the currency the firm prices in (EUR, USD…). No conversions.
- Forex tiers: `"unit": "percent"`, rules as % of account size.
  Futures tiers: `"unit": "usd"`, rules as dollar amounts on each account.
- Prices are plain numbers. `standard` = full/crossed-out price,
  `promo` = discounted price (null if no promo running). If there's a discount
  code, put it in the market's `promo_code`.
- `about`: 1-2 sentences **in our own words** — what they offer and to whom.
  No marketing claims, no copying their text. If background is unverified, set
  `about_note: "Company background not yet verified."`
- `affiliate_link`: leave `""` until we have a real tracked link.
- `_notes.last_verified`: today's date (YYYY-MM-DD) and `source`.

## 3. Validate and show
1. Run `npm run check:data` and fix every error. Read every warning to the
   person in plain English.
2. Start (or reuse) `npm run dev` and tell them to open
   `http://localhost:3000/funded-accounts/<id>` and compare each table against
   their screenshots — prices, sizes, rules.
3. List every field left `null` so they know what to look up next.

## 4. Wrap up
Summarise: firm added/updated, how many challenge types and account sizes,
fields still unknown, and remind them to `/ship` when happy.
