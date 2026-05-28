# Verify

## Commands run
1. `node bin/c3spec.js list` — passed.
2. `node bin/c3spec.js list --json` — passed.
3. `pnpm test -- test/commands/workspace.test.ts` — passed after updating workflow expectations for core profile.
4. `pnpm test` — passed.

## Outcomes
- Archive cleanup completed and CLI list surfaces only retained c3spec-era changes.
- Workspace test expectations were aligned with current core profile workflow IDs (`propose`, `explore`, `apply`, `sync`, `archive`).
- Full test suite passed (`79` files, `1421` tests).

## Changed filesystem state
- Deleted 77 pre-fork archive folders dated through `2026-04-23`.
- Deleted 4 additional archive folders imported by fork bootstrap commit (`aa6a322`).
- Deleted 15 bootstrap-imported active change folders classified as legacy.
- Removed `c3spec/changes/IMPLEMENTATION_ORDER.md` (stale legacy narrative).

## Residual risks
- Some historical markdown references to removed legacy changes may remain in exploratory docs.

## Spec sync status
- Added delta spec only under this change (`specs/repo-history-hygiene/spec.md`).
- No sync into `c3spec/specs/` performed yet.
