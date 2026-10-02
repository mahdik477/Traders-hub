---
name: ship
description: Get the current branch ready for a pull request - runs the data check, lint and production build, runs the compliance and code reviewers, fixes what they find (with permission), commits, pushes the branch and writes a plain-English PR description. Use when someone says they're done, wants to ship, push, open a PR or "send it for review".
---

# Ship this branch

Explain each step in one plain-English line. Never push to `main`.

1. **Where are we?** `git branch --show-current` and `git status`. If on
   `main`, stop and create a branch first (`/start`), carrying the changes over
   with `git switch -c <name>/<feature>`.
2. **Sync**: `git fetch origin main`. If main has moved on, run
   `git merge origin/main` and resolve any conflicts (explain them first).
3. **Automatic checks**: `npm run check` (data check + lint + build). Fix
   failures, then re-run until it passes.
4. **Reviews** — run both agents in parallel on this branch:
   - `compliance-reviewer`
   - `code-reviewer`
   Show the person a short combined summary: verdicts, every **Must fix** and
   **Should fix** in plain English. Fix all Must-fix items; ask before doing
   Should-fix items that change how the site looks or reads. Re-run
   `npm run check` after fixes.
5. **Commit**: `git add` the relevant files (never `.env*`), then commit with a
   short plain-English message describing what changed for site visitors.
6. **Push**: `git push -u origin <branch>`. If the push is rejected, explain
   why in plain English and stop.
7. **Pull request**:
   - If the `gh` command works (`gh auth status`), run
     `gh pr create --base main` with the description below.
   - Otherwise print the GitHub link from the push output (or
     `https://github.com/mahdik477/Traders-hub/compare/<branch>?expand=1`) and
     give the description in a code block to paste.
   PR description format:
   ```
   ## What changed
   <2-4 bullets a non-coder understands>
   ## How to check it
   <the exact pages/clicks to try on the Vercel preview, incl. phone size>
   ## Reviews
   Compliance: <verdict> · Code: <verdict> · npm run check: passed
   ## Still open
   <unknown data fields, follow-ups — or "nothing">
   ```
8. Finish by telling them who should review it (a teammate who didn't write
   it) and that Vercel will post a preview link on the PR in a minute or two.
