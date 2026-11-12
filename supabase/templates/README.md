# Tradox email templates (Supabase Auth)

Branded versions of the emails Supabase sends when someone signs in. They are
**not used until a founder pastes them into Supabase** — nothing in the site
code sends email.

| File | Supabase template | Subject line to paste |
|---|---|---|
| `magic-link.html` | Magic Link | `Your Tradox sign-in link` |
| `confirm-signup.html` | Confirm signup | `Confirm your email for Tradox` |
| `reset-password.html` | Reset Password | `Choose a new Tradox password` |

`preview.html` shows all three side by side — open it in a browser to check
how they look. It is for us only and is never sent.

## How to install (2 minutes)

1. Supabase dashboard → your project → **Authentication → Emails**
   (older dashboards: **Email Templates**).
2. For each row above: open that template, paste the subject, switch the body
   to the HTML/source view, delete what's there, paste the whole file, **Save**.
3. **Authentication → URL Configuration**: make sure **Site URL** is your live
   site address and **Redirect URLs** includes
   `http://localhost:3000/auth/callback` and
   `https://<your-domain>/auth/callback` (plus your Vercel preview pattern,
   e.g. `https://*-mahdik477.vercel.app/auth/callback`).
4. Send yourself a link from `/sign-in` and check it on your phone and laptop.

## Rules for editing these

- Inline styles only, tables for layout — email apps ignore `<style>`, CSS
  variables and web fonts.
- No images (they're often blocked) and no tracking pixels.
- Keep `{{ .ConfirmationURL }}` in both the button and the plain link, and
  keep the disclaimer line in the footer.
- These are account emails, not marketing — never add offers or promotions.
  Any marketing email would need an unsubscribe link and an opt-in (see
  CLAUDE.md).
- Regenerate all three from one layout rather than hand-editing one, so they
  stay consistent.

## Before launch

Supabase's built-in sender only allows a few emails an hour and comes from a
generic Supabase address. Before real users arrive, connect your own sender
(Authentication → Emails → SMTP settings, e.g. with Resend or Postmark) so
emails come from your domain. That's a new tool, so the founders decide.
