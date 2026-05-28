# Retrospective: Research workflow routing

## Evidence

- Files changed: start skill, new research skill, workflow routing spec, host instruction renderer, canonical skill registry
- Verification: `pnpm test` and `pnpm exec tsc --noEmit` both passed
- Tasks: 8/8 complete

## What worked

- Keeping research as a distinct workflow path clarified routing without destabilizing existing T1/T2/T3 flows.
- Updating canonical skill registry and host instructions in the same pass prevented host drift.

## What didn't

- Initial scope wording still used tier-only language in a few places, which needed follow-up cleanup.

## Learning

- one-off — no memory entry
