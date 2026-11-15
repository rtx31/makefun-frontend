# makefun-frontend

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/rtx31/makefun-frontend/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/rtx31/makefun-frontend/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A fast, read-only frontend for make.fun bounties — board, bounty page, leaderboard and account profile — built on the live public API at https://make.fun/api. Vanilla JS, no framework, no build step, no sign-in. Static files under `app/`; `main.ts` (Node 22, stdlib only) copies `app/` and `screenshots/` to `/output` and writes the judge's dossier.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080.

## Routes

- `#/` — bounty board: live pot, entry fee, time left, entries; filter by open now, closing soon, or free entry.
- `#/bounty/<slug>` — one bounty: summary, live rewards table, dates, rules.
- `#/bounty/<slug>/leaderboard` — ranked entries with win rate and 90% interval; thousands of rows windowed, full detail on request.
- `#/u/<handle>` — account profile: record, wallet, solutions.

## Notes

- One API request per view; repeat visits revalidate with ETags (a 304 costs nothing).
- Open/closed is computed from each bounty's deadline, not its `status` field.
- First-load total (gzip-9): see the dossier in `/output/dossier.json` after running `main.ts`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=4gvpf9bn&utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
