# Setting up sign-in (Supabase) — click by click

This turns on the optional account features: **Sign in with Google**, **sign in
with an email link**, saved listings that follow you across devices, My Hub,
learning progress and the price-alert opt-in list.

Until you finish these steps the site hides every sign-in control and works
exactly as it did before. Nothing breaks if you stop halfway.

You need: a Google account, about 30 minutes, and access to the Vercel project.
No coding.

> **What gets stored about a person:** their Supabase user id, their email
> address, the time they ticked "I'm 18 or over", and whatever they save on the
> site (listings, comparisons, recently viewed, progress ticks, per-firm alert
> preferences). Nothing else in our own tables — no names, no photos, no
> payment details. (Supabase's own sign-in tables also keep the Google profile
> record and sign-in timestamps for each user; those are deleted with the
> account.)

---

## Part 1 — Create the Supabase project (10 min)

1. Go to <https://supabase.com> and click **Start your project**. Sign in with
   GitHub or Google.
2. Click **New project**.
3. Fill in:
   - **Organization:** pick yours (or create one called "Tradox").
   - **Name:** `tradox`
   - **Database password:** click **Generate a password**, then **copy it into
     your password manager**. You will almost never need it, but you cannot see
     it again.
   - **Region:** choose the one closest to most visitors (for the UAE pick a
     European or Middle East region if offered).
   - **Pricing plan:** Free is fine to start.
4. Click **Create new project** and wait 1–2 minutes for the green "Project is
   ready" state.

## Part 2 — Create the tables (5 min)

1. In the left sidebar click **SQL Editor**.
2. Click **New query** (top left of the editor).
3. Open the file `supabase/schema.sql` from this repository, select everything
   (Ctrl+A), copy it, and paste it into the editor.
4. Click **Run** (bottom right, or Ctrl+Enter).
5. You should see **"Success. No rows returned"**. If you see an error, run it
   again — the file is written so it is safe to run twice.
6. Check it worked: click **Table Editor** in the sidebar. You should see six
   tables: `profiles`, `saved_items`, `saved_comparisons`, `recently_viewed`,
   `learning_progress`, `alert_preferences`. Each has a small shield icon,
   meaning **row-level security is on** — people can only ever see their own
   rows.

## Part 3 — Copy the two public keys (2 min)

1. Sidebar → **Project Settings** (the gear at the bottom) → **API Keys**.
   (On older dashboards: Project Settings → API.)
2. Copy two things:
   - **Project URL** — looks like `https://abcdefghijklmnop.supabase.co`
   - **Publishable key** — starts with `sb_publishable_…`. (If your dashboard
     only shows an **anon public** key, that works too.)
3. **Never copy the `service_role` / secret key anywhere.** The site does not
   need it. If it ever ends up in a file or chat, go to the same page and
   click **Rotate**.

## Part 4 — Turn on the email link sign-in (3 min)

1. Sidebar → **Authentication** → **Sign In / Providers** (older dashboards:
   **Providers**).
2. **Email** is on by default. Click it and make sure:
   - **Enable Email provider** — on
   - **Confirm email** — on (this is what makes the link work)
   - **Secure email change** — on
   Click **Save**.
3. Sidebar → **Authentication** → **URL Configuration**:
   - **Site URL:** your live address, e.g. `https://tradox.vercel.app` (or
     your real domain once you have one). No trailing slash.
   - **Redirect URLs** → **Add URL**, one at a time:
     - `https://tradox.vercel.app/auth/callback`  ← use your real address
     - `https://*-YOUR-TEAM.vercel.app/auth/callback`  ← lets preview
       deployments sign in too; copy the exact pattern from a preview link
     - `http://localhost:3000/auth/callback`  ← for testing on your own computer
   Click **Save**.
4. Optional but recommended, **Authentication → Emails** (older: Email
   Templates) → **Magic Link**: change the subject to something like
   "Your Tradox sign-in link" and keep the `{{ .ConfirmationURL }}` placeholder
   in the body. Supabase's free plan sends only a handful of emails per hour;
   if the site gets busy you will need to connect an email service here
   (**Authentication → SMTP Settings**) — that's a later job.

## Part 5 — Create the Google sign-in keys (10 min)

Do this in Google Cloud, then paste the result into Supabase.

1. Go to <https://console.cloud.google.com> and sign in.
2. Top bar → project picker → **New project** → name it `Tradox` → **Create**,
   then make sure it's selected in the picker.
3. Left menu → **APIs & Services** → **OAuth consent screen** (may be called
   **Google Auth Platform → Branding**):
   - **User type:** External → **Create**.
   - **App name:** Tradox. **User support email:** your team email.
   - **App logo:** optional (use `public/brand/tradox-td.png`).
   - **App domain → Application home page:** your site URL.
   - **Authorized domains:** add your site's domain (e.g. `vercel.app`, or your
     real domain) **and** `supabase.co`.
   - **Developer contact email:** your team email. **Save and continue** through
     the remaining steps (no scopes need adding; the defaults — email and
     profile — are enough).
   - Under **Audience** (or on the summary page) click **Publish app** so anyone
     with a Google account can sign in, not just test users.
4. Left menu → **APIs & Services** → **Credentials** → **Create credentials** →
   **OAuth client ID**:
   - **Application type:** Web application
   - **Name:** Tradox web
   - **Authorized JavaScript origins:** your site URL (e.g.
     `https://tradox.vercel.app`) and `http://localhost:3000`.
   - **Authorized redirect URIs:** this one is **Supabase's** address, not
     yours. Get it from Supabase: **Authentication → Sign In / Providers →
     Google** — it shows a **Callback URL (for OAuth)** like
     `https://abcdefghijklmnop.supabase.co/auth/v1/callback`. Copy it here.
   - Click **Create**. A box shows a **Client ID** and a **Client secret**.
     Keep this box open.
5. Back in Supabase: **Authentication → Sign In / Providers → Google**:
   - Toggle **Enable Sign in with Google** on.
   - Paste the **Client ID** and **Client secret** from Google.
   - Click **Save**.

## Part 6 — Add the variables to Vercel (3 min)

1. Go to <https://vercel.com>, open the Tradox project → **Settings** →
   **Environment Variables**.
2. Add two variables. For each, tick **Production**, **Preview** and
   **Development** so every deployment gets them:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | the Project URL from Part 3 |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the publishable (or anon) key from Part 3 |

3. Click **Save**. Vercel only applies variables to **new** deployments, so go
   to **Deployments** → the latest one → **⋯** → **Redeploy**.

   Optional: `NEXT_PUBLIC_SITE_URL` = your public address (e.g.
   `https://tradox.io`). It is used for share-image links. Without it the
   site uses the Vercel production URL automatically.

## Part 7 — Add the variables for your own computer (2 min)

1. In the repo folder, copy `env.example` and name the copy `.env.local`.
2. Open `.env.local` and paste the same two values after the `=` signs.
3. Save. Restart `npm run dev` if it was already running.
4. `.env.local` is ignored by git on purpose. **Never** commit it, paste it into
   chat, or put the keys anywhere else.

## Part 8 — Test it (5 min)

1. Open the site. A **Sign in** button should now appear in the header (top
   right) and a **My Hub** tab in the phone bottom bar.
2. Click **Sign in → Create an account** (this opens `/sign-up`) **→ Email me
   a sign-up link**, use your own address, open the email, click the link. You
   should land back on the site, see the **"One quick check — I'm 18 or
   over"** box, confirm it, and then see your initial in the header.
   (The **Sign in** page itself never creates an account from a typed email
   address — that is on purpose, so a typo can't make one.)
3. Save a firm (bookmark icon), open **My Hub** — it should be listed.
4. Sign out, then try **Continue with Google**.
5. In Supabase → **Table Editor → profiles** you should see one row: your user
   id, your email, and the confirmation time. That is all our own tables store
   (Supabase's **Authentication → Users** screen also holds the sign-in record,
   including the Google profile details, which go when the account is deleted).

## Part 9 — Passwords, "What I'm using" and branded emails (10 min)

Added 12 November 2026. Do these once, in this order:

1. **Add the new table.** Supabase → **SQL Editor** → **New query** → paste the
   whole of `supabase/migrations/2026-11-12-my-stack.sql` → **Run**. It only
   adds one table (`my_stack`) with the same "own rows only" lock as the
   others. Until you run it, the "I use this" ticks still work but stay in
   the browser.
2. **Turn on password sign-in.** **Authentication → Providers → Email** →
   make sure email/password sign-in is enabled, set **minimum password
   length to 10**, and turn on **leaked-password protection** if your plan
   offers it. **Keep "Confirm email" on — never switch it off.** It is what
   makes a password sign-up wait for the emailed link, and what stops the
   Create account page from revealing which email addresses already have an
   account. Check **Email OTP Expiration** is 3600 seconds (1 hour) — our
   emails and the sign-in and sign-up pages say "expires in 1 hour".
3. **Paste the branded emails.** Follow `supabase/templates/README.md`
   (Authentication → Emails → Magic Link / Confirm signup / Reset Password).
4. **Check the redirect list.** Authentication → **URL Configuration** →
   **Redirect URLs**: add each with `**` on the end so the `?next=` part is
   allowed — `http://localhost:3000/auth/callback**`,
   `https://<your-domain>/auth/callback**` and your Vercel preview pattern
   (e.g. `https://*-mahdik477.vercel.app/auth/callback**`).
   Note: Supabase's built-in email sender allows only a few emails an hour,
   and some plans only let you edit templates once a custom sender (SMTP) is
   connected. If the template editor is locked or "Too many requests" shows
   up while testing, that's why — setting up a sender is a founder decision.
5. **Test:** create an account with an email link (`/sign-up`) in a private
   window → you should land on "Choose a password" → set one → sign out →
   sign in (`/sign-in`) with the Password tab → try "Forgot password?" → the
   reset email arrives and the link lets you choose a new one.

## Part 10 — Separate Sign in and Create account pages

Added 15 November 2026. Nothing to change in Supabase — this is how the two
pages behave, and what to test after the update goes live:

- **`/sign-up` (Create your account)** is for new people. Google, an email
  link, or **Create a password** (10+ characters; the "Confirm signup" email
  is sent and the account works once its link is opened).
- **`/sign-in`** is for people coming back. Its email link is sent **only if
  the address already has an account** — a mistyped address no longer creates
  an empty account.
- **Neither page says whether an address has an account.** Both always show
  "Check your inbox". Please don't ask for that to be "fixed": a page that
  answered "that email isn't registered" would let anyone test a list of
  addresses against our users.

Test with two addresses, one that has an account (A) and one that doesn't (B):

1. `/sign-in` → email link → **B**: "Check your inbox" appears, **no email
   arrives**, and no new user shows up in Supabase → Authentication → Users.
2. `/sign-in` → email link → **A**: same screen, the email arrives and signs
   you in.
3. `/sign-up` → Password → **B** + a 10+ character password: "Check your
   inbox", the "Confirm your email" message arrives, its link signs you in,
   and the 18+ box appears. Sign out, then sign in with that password.
4. `/sign-up` → Password → **A** + any password: the same "Check your inbox"
   screen. A normal sign-in link arrives; A's real password is unchanged.
5. **Security check.** `/sign-up` → Password → a brand-new address + password
   "one"; do **not** open the email. Wait a minute, then (ideally in a
   different browser) `/sign-up` → Password → the same address + password
   "two". Open the newest email: you should be asked to **choose a password**.
   Sign out and try signing in with "one" — **it must fail**. If "one" works,
   tell the developer straight away.
6. Open a firm page while signed out → price-alert box → "create a free
   account" → finish signing up → you should land back on that firm page.

## If something doesn't work

- **Sign in button never appears** → the two `NEXT_PUBLIC_…` variables are
  missing or misspelt in Vercel/`.env.local`, or you didn't redeploy / restart.
- **Sign-in page says "Check your inbox" but nothing arrives** → either the
  address has no account (the page hides that on purpose — use **Create an
  account**), or Supabase's hourly email limit was hit. Check Supabase →
  **Authentication → Logs**.
- **After confirming, a password sign-up is asked to "Choose a password"
  again** → that is the safety step: the password is only kept if it was typed
  in the same browser that opens the email, on the first sign-up for that
  address. Anything else is cancelled so a stranger can't pre-set a password
  on someone's address.
- **Email link says "expired" or "didn't work"** → the Redirect URL in Part 4
  step 3 doesn't match your site's address exactly, or the link was opened on a
  different device/browser from the one that requested it (links are tied to
  the browser that asked). Request a new one.
- **Google shows "redirect_uri_mismatch"** → the redirect URI in Google Cloud
  (Part 5 step 4) must be Supabase's `/auth/v1/callback` address, not the
  site's.
- **Google shows "app not verified" to other people** → go back to the OAuth
  consent screen and click **Publish app**.
- **"That didn't save" on the 18+ box** → the SQL in Part 2 hasn't been run, or
  failed. Run it again and check the six tables exist.

## Before telling the public

- Replace the placeholder privacy contact address on `/privacy`
  (`privacy@tradox.io`) with a real inbox you check.
- Have the privacy policy reviewed by a lawyer (it already says so).
- Decide who on the team can log into Supabase and Google Cloud; use the
  password manager for both.
- Alert emails are **not** sent by anything yet. When you add an email tool,
  read from `alert_preferences` where `opted_in = true` only, and include an
  unsubscribe link in every email (UAE PDPL + GDPR).
