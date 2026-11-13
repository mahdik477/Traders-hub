---
paths:
  - "*-data-*.json"
  - "strategies-data.json"
  - "src/lib/propfirms.ts"
  - "src/lib/courses.ts"
  - "src/lib/propfirm-types.ts"
  - "scripts/check-data.mjs"
---

# Listing data files

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
