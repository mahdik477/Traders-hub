---
name: start
description: Start a new piece of work - switch to main, pull the latest changes, install dependencies if needed and create a correctly named branch. Use when someone says they want to start something new, begin a feature, or "switch back to main and pull".
argument-hint: "[what you're working on, e.g. signal groups page]"
disable-model-invocation: true
---

# Start new work

The person wants to start: **$ARGUMENTS**

Explain each step in one plain-English line as you go.

1. Run `git status`. If there are uncommitted changes, STOP and ask what to do
   with them (finish and `/ship` them, or keep them on their current branch).
   Never discard someone's work.
2. `git switch main` then `git pull`.
3. If `package-lock.json` changed in that pull (`git diff HEAD@{1} --name-only`
   lists it), run `npm install`.
4. Work out the person's name for the branch prefix: use
   `git config user.name`'s first name in lowercase (e.g. `kian`). If unclear,
   ask once.
5. Create the branch: `git switch -c <name>/<short-feature-slug>` (lowercase,
   dashes, max ~4 words, e.g. `kian/signal-groups-page`). If no feature was
   given, ask for one.
6. Read CLAUDE.md's "Sections and build status" table. If the requested work
   builds ahead of the current phase, say so and confirm before going on.
7. Finish with a 3-5 line plan in plain English for the feature and ask
   "Shall I start?" — unless the person already said to go ahead.
