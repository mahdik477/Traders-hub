---
name: add-course
description: Add a new trading course listing (or update one) on the Courses page - creates courses-data-<name>.json with curriculum, formats, pricing, refund policy, Trustpilot and sourced testimonials, adds the logo, and validates it. Use whenever someone wants to add, update or re-check a course.
argument-hint: "[course name or website]"
---

# Add or update a course

Course: **$ARGUMENTS**

## 1. Gather the facts
- Read the course's own site (WebFetch) and any screenshots/links the person
  shares. Record only what's actually stated; anything unknown → `null` or an
  empty list.
- Check Trustpilot for the rating and review count if a page exists (link it).
- Refund policy: quote what their site says in plain words. If nothing is
  stated, say exactly that: "No refund policy is stated on the provider's
  website (last checked <date>)."

## 2. Write the file
- Copy the shape of `courses-data-six-figure-capital.json` into
  `courses-data-<id>.json` in the repo root. `id` = lowercase-dashes; it becomes
  `/courses/<id>`.
- `tagline` (one line) and `about` (2-3 sentences) **in our own words**. No
  hype, no income claims.
- `pricing`: keep the provider's currency and billing terms exactly.
- `testimonials`: max 3, each with a `source` saying where it was quoted from.
  Skip any testimonial that promises income or results ("I made $10k in a
  week") — we don't republish those.
- `affiliate_link`: `null` until we have a real tracked link.
- Add `"_notes": { "last_verified": "<today YYYY-MM-DD>", "source": "<pages used>" }`.
- Logo: ask the person to save the logo into `public/courses/` (webp or png)
  and set `logo` to `/courses/<file>`. If none, set `null` (a lettermark is
  shown).

## 3. Validate and show
1. `npm run check:data` — fix all errors, explain warnings in plain English.
2. With `npm run dev` running, tell them to check `/courses` and
   `/courses/<id>` (light and dark mode, and on a narrow window).
3. List anything left unknown.

Then remind them to `/ship` when happy.
