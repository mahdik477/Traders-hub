# Supabase (accounts)

`schema.sql` creates every table the site's account features use, switches
on row-level security for each one, and adds a self-service
`delete_my_account()` function. It is safe to run more than once.

The click-by-click setup guide — creating the project, running this file,
setting up Google sign-in and adding the environment variables — is in
`SETUP-ACCOUNTS.md` at the repo root.

What the site stores per person: user id, email, the time they confirmed
they are 18+, and whatever they save (listings, comparisons, recently viewed,
learning progress, per-firm alert preferences). Nothing else.
