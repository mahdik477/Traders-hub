# Accounts & My Hub — overnight build plan (live handoff file)

**Read this first if you are a model picking this up.** Branch:
`kian/accounts-and-my-hub` (off `main` at 6592942). Work through the steps
below **in order**, one per run. After each step: `npx tsc --noEmit`,
`npx eslint <changed files>`, `npm run check:data`, then commit with a
plain-English message and `git push origin kian/accounts-and-my-hub`.
Tick the step in the status board and note the commit hash. Stop when every
step is done.

Read `CLAUDE.md`, `AGENTS.md` and `DESIGN.md` (Aurora Terminal + Interior
kit + Picker) before writing code. This Next.js 16 differs from your
training data — check `node_modules/next/dist/docs/` before using an API.

## Hard rules (overnight, no human watching)

- **Never** merge, never push to `main`, never force-push, never
  `git reset --hard` / `git clean`.
- **Never** apply anything to the live Supabase project (no MCP
  `apply_migration` / `execute_sql`, no dashboard changes). Write SQL into
  `supabase/` files only; a founder runs it in the morning.
- **Never** send email, add an email service, analytics, Stripe or any new
  npm dependency.
- **Never** read or print `.env*` files or keys.
- Don't touch listing data files (`*-data-*.json`) or the Strategies
  section's directory/detail pages, simulators or quizzes.
- No performance / win-rate / "best" wording; keep the footer disclaimer;
  "Sponsored"/"Our choice" labels stay.
- Anything touching **user data, emails, passwords or legal wording** gets
  a bold line in the PR under "Test carefully".
- Every page must work at 375px, in light and dark mode, keyboard only.

## Decisions taken (founder can change these in the morning)

The founder was asked three questions and went to bed before answering, so
the recommended option was taken for each:

1. **Passwords — a "Choose a password" screen straight after the email
   link (founder's answer, 2026-11-11).** The first time someone arrives
   from an email link (or first Google sign-in) and has no password yet,
   `/auth/callback` sends them to `/welcome/password` before My Hub. The
   screen: email shown, new password + confirm, show/hide, min 10 chars,
   strength hint, primary "Save password and continue", and a clear
   "Skip for now" link that goes on to the `next` page. Skipping is
   remembered (browser store `tradox:password-skipped`) so it isn't shown
   again on every sign-in; My Hub keeps an "Add a password" card for later.
   Saving uses `supabase.auth.updateUser({ password })`; whether a person
   already has one is read from `user.user_metadata.has_password` (set to
   true in the same `updateUser` call, `data: { has_password: true }`).
   The sign-in page gains "Sign in with password" (email + password,
   `signInWithPassword`) and "Forgot password?" (`resetPasswordForEmail` →
   `/auth/callback?next=/welcome/password`). Never log or store the
   password anywhere ourselves.
2. **"What I'm using" — self-ticked, synced to the person's own rows.** We
   can't see real sign-ups on other sites. People tick it themselves:
   "I'm taking this course", "I trade with this broker", "I have an account
   with this firm", "I use this tool". Stored like saves: browser store
   first (`src/lib/local-store.ts`), synced by `AccountSync.tsx` to a new
   table `my_stack` (own rows only, RLS like the others). Privacy policy and
   `supabase/schema.sql` comments updated to say so. Strategies "currently
   learning" = strategies viewed or quiz-done (existing data, no new
   storage).
3. **Sign-in email — template only.** Design a branded HTML email for the
   magic link (and the password-reset email). It lives in
   `supabase/templates/` and is pasted into Supabase → Authentication →
   Email Templates by a founder. Keep Supabase's built-in sender; a real
   sender (e.g. Resend) is a later, founder-led decision.

## Status board

> The overnight cloud routine (11–12 Nov) did not save anything: early runs
> hit the usage limit, later runs stalled on permission prompts (nobody to
> approve `python3` or `git push`). It is switched off. Work continues in a
> live session instead.

| # | Step | Status | Commit |
|---|---|---|---|
| 0 | This plan file | done | (this commit) |
| 1 | Sign-in page redesign (incl. Password tab + Forgot password) | done | see git log |
| 2 | Branded email templates | done | see git log |
| 3 | "What I'm using" store + buttons on listings | done | see git log |
| 4 | Database: `my_stack` table + sync (SQL file only, not applied) | done | see git log |
| 5 | My Hub redesign as a profile dashboard | done | see git log |
| 6 | Password screen after the link + sign in with password + forgot | done | see git log |
| 7 | Privacy policy + schema/README notes | done | see git log |
| 8 | Checks, reviews, draft PR | done | see git log |

## Step details

### 1. Sign-in page redesign (`src/app/sign-in/page.tsx`, `src/components/auth/SignInPanel.tsx`)
Two-column on desktop (single column on phones):
- Left: a `kit-panel` card. Google button (outline, full width, 52px),
  "or" divider, email field + primary "Email me a sign-in link". A small
  segmented switch (`.seg`) at the top: **Email link** | **Password**
  (the Password tab can be built in step 6; until then show only the link
  form and hide the switch).
- After sending: replace the form with a "Check your inbox" state — mail
  icon in an `icon-chip`, the address in bold, a 60-second countdown on a
  "Resend link" button, "Wrong address? Change it", and "Can't find it?
  Check spam/promotions". Announce with `role="status"`.
- Right: "What an account gives you" — 4 rows with icons (saved listings
  on every device, Learn & strategy progress, comparisons, what you're
  using), then the privacy line (keep the existing wording about what is
  stored and the 18+ confirmation) and the privacy link.
- Signed-in state: a profile card (initial avatar from the email's first
  letter, the email, "Go to My Hub", "Sign out").
- Error banner stays (`ERRORS` map). Keep `safeNextPath`.
- Respect reduced motion; no blur; 44px+ targets.

### 2. Branded email templates (`supabase/templates/`)
- `magic-link.html` (Supabase variable `{{ .ConfirmationURL }}`; also
  `{{ .Email }}` is available), `confirm-signup.html`,
  `reset-password.html`. Table-based HTML, inline styles only (email
  clients ignore `<style>` and CSS variables), max width 560px, dark
  `#070708` page / `#101012` card, gold `#e0b44a` button with `#161208`
  text, system font stack, a text-only logo "TRADOX" (no remote images —
  they get blocked), a plain-text fallback link under the button, "link
  expires in 1 hour and works once", "didn't ask for this? ignore it", and
  the one-line disclaimer ("Tradox is a discovery platform… not financial
  advice"). No tracking pixels. Subject lines in `supabase/templates/README.md`
  with paste-in instructions (Dashboard → Authentication → Email Templates;
  set the redirect URL allow-list to include `/auth/callback`).
- Preview: also save `supabase/templates/preview.html` that shows all three
  side by side for screenshots (not shipped to users).

### 3. "What I'm using" (`src/lib/local-store.ts`, new `src/components/UsingButton.tsx`)
- New list store `tradox:stack`: `{ kind: "firm"|"broker"|"course"|"tool", id, since: ISO, note?: never }`.
  Don't add free-text fields.
- `UsingButton` next to `SaveButton` on detail pages (firm, course,
  broker, tool) — label per kind ("I have an account here", "I trade with
  this broker", "I'm taking this course", "I use this tool"); pressed state
  "✓ In My Hub". `aria-pressed`. Small helper text: "Just for your My Hub —
  we don't check or share it."
- Never imply endorsement; no counts of how many people use something.

### 4. Database (`supabase/schema.sql`, `supabase/migrations/2026-11-12-my-stack.sql`, `AccountSync.tsx`)
- `create table if not exists public.my_stack (user_id uuid references auth.users on delete cascade, kind text check (kind in ('firm','broker','course','tool')), item_id text check (char_length(item_id) between 1 and 120), since timestamptz not null default now(), primary key (user_id, kind, item_id));`
  RLS on, "own rows" policy identical to the others. Add to the
  delete cascade note.
- Put the same SQL in the dated migration file so the founder can run just
  that. **Do not run it.**
- Add a `my_stack` spec to `AccountSync.tsx` following the existing specs.
  If the table doesn't exist yet (error code `42P01`), sync must fail
  quietly and leave the browser copy alone.

### 5. My Hub as a profile dashboard (`src/app/my-hub/page.tsx`, `src/components/MyHub.tsx`)
- Header card: avatar (first letter of the email in a gold circle), email,
  "Signed in with Google / email link", member since (`user.created_at`),
  Sign out. Signed-out: same card says "Browsing without an account" with
  Sign in.
- Overview strip (`stat-strip`): Learn x/9, strategy quizzes done, saved,
  using.
- Sections, each a `kit-panel`:
  1. **Learn — the 9 parts**: a 9-step tracker (done ticks, next part
     highlighted, "Continue with part N" button).
  2. **Strategies you're learning**: viewed or quiz-done strategies with a
     done tick per quiz; "Browse strategies".
  3. **What I'm using**: grouped Funded accounts / Brokers / Courses /
     Tools, from step 3, with Remove.
  4. Saved listings, Saved comparisons, Price alerts, Recently viewed (keep
     the existing behaviour).
- Account panel: email, password card (step 6), "Your data" + delete
  account (keep the existing flow and wording exactly).
- Empty states with one clear action each. Tabs on phones are fine
  (`.seg`), all sections stacked on desktop.

### 6. Password screen after the link (`src/app/auth/callback/route.ts`, new `src/app/welcome/password/page.tsx`)
- Callback: after exchanging the code, if the session's user has no
  `user_metadata.has_password` and isn't a password-reset return, redirect
  to `/welcome/password?next=<safe next>`. Keep `safeNextPath`. The 18+
  confirmation (`AgeConfirmModal`) must still happen; check the order works
  (password screen first, then the 18+ dialog on the next page is fine).
- `/welcome/password`: a centred `kit-panel` card — "One more step: choose a
  password", the email, two fields with show/hide, min 10 chars, strength
  hint (length + variety; no library), "Save password and continue",
  "Skip for now". Signed-out visitors are sent to `/sign-in`. `robots:
  noindex`.
- My Hub "Password" card: "Add a password" / "Change password" (same form).
- Sign-in page Password tab (from step 1): email + password + "Forgot
  password?".
- **Founder morning step** (write it in the PR): Supabase → Authentication →
  Providers → Email → make sure email + password is enabled; set minimum
  password length 10.

### 7. Privacy + docs
- `src/app/privacy/page.tsx`: add that an account can also hold "what
  you're using" (things you tick yourself) and, if set, a password (stored
  hashed by our account provider; we never see it). Keep the rest.
- Update `CLAUDE.md` My Hub row and the Supabase bullet, and
  `SETUP-ACCOUNTS.md` with the morning steps.

### 8. Finish
- `npm run check` must pass. Run the `code-reviewer` and
  `compliance-reviewer` agents; fix every Must fix. Open a **draft** PR
  (`gh pr create --draft --base main`) with: What changed, How to check it,
  **Test carefully** (password, emails, user data, privacy wording),
  **Morning steps for a founder** (run the migration SQL, paste the email
  templates, enable password sign-in), Reviews, Still open. End with the
  Claude Code attribution line. Never merge.

## Morning steps for a founder (keep this list current)

1. Read the draft PR; try the Vercel preview link on a phone.
2. Supabase → SQL Editor → run `supabase/migrations/2026-11-12-my-stack.sql`.
3. Supabase → Authentication → Email Templates → paste the three templates
   from `supabase/templates/` (subjects in its README).
4. Supabase → Authentication → Providers → Email → password sign-in on,
   minimum length 10.
5. If you'd answer the three decisions differently, say so and it'll be
   changed.
