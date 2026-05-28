# Cleanup Audit — codebase-audit-cleanup

## Inventory snapshot

- `src/` files: 142
- `test/` files: 85
- `docs/` files: 11
- `schemas/` files: 10
- `c3spec/schemas/` files: 14

## Key findings

1. **Schema systems are active, not residue-only**
   - `c3spec/config.yaml` defaults project schema to `superpowers-bridge`.
   - `src/core/init.ts` default schema is `superpowers-bridge`.
   - Artifact graph resolver loads built-in package schemas from root `schemas/`.
   - Tests exercise schema resolution and schema commands heavily.
   - **Disposition:** keep for now; do not delete blindly.

2. **No `.github/` release pipeline surface currently present**
   - No `.github` workflows/files found.
   - **Disposition:** already mostly cleaned.

3. **Likely fork/history residue in root docs/metadata**
   - Candidates: `README_OLD.md`, `WORKSPACE_REIMPLEMENTATION_DIRECTION.md`, `WORKSPACE_REIMPLEMENTATION_START_HERE.md`, `openspec-parallel-merge-plan.md`.
   - `MAINTAINERS.md` appears referenced by `README_OLD.md` only (not current README).
   - **Disposition:** removable candidates pending final link-check.

4. **Nix/flake surface was removed by explicit Band C approval**
   - Removed: `flake.nix`, `flake.lock`, `scripts/update-flake.sh`.
   - Removed Nix spec capability: `c3spec/specs/ci-nix-validation/`.
   - Updated docs/scripts references accordingly.

5. **Dependency surface appears mostly active**
   - Core dependencies (`commander`, `chalk`, `yaml`, `zod`, `@inquirer/*`, `ora`, `fast-glob`, `cross-spawn`) are directly referenced in source.
   - **Disposition:** no obvious safe dependency removals yet without deeper per-module replacement decisions.

## Candidate matrix (initial)

| Candidate | Evidence | Band | Recommendation |
| --- | --- | --- | --- |
| `README_OLD.md` | legacy naming; not part of current docs navigation | A | Remove |
| `WORKSPACE_REIMPLEMENTATION_DIRECTION.md` | historical planning artifact | A | Remove |
| `WORKSPACE_REIMPLEMENTATION_START_HERE.md` | historical planning artifact | A | Remove |
| `openspec-parallel-merge-plan.md` | historical planning artifact | A | Remove |
| `MAINTAINERS.md` | likely non-essential; weak linkage | B | Removed (validated) |
| `CHANGELOG.md` | large legacy history, potential user-facing release record | C | Removed (explicitly approved) |
| `schemas/spec-driven` | loaded as built-in schema fallback | C | Keep |
| `schemas/workspace-planning` | loaded as built-in schema fallback | C | Keep |
| `c3spec/schemas/superpowers-bridge` | active project schema + templates + tests | C | Keep (possible future consolidation change) |
| `flake.*` + `scripts/update-flake.sh` | previously spec/docs-referenced Nix support surface | C | Removed (explicitly approved) |

## Validation matrix

- Band A removals:
  - `rg` link/reference checks
  - `npm test`
- Band B removals:
  - Targeted feature tests for touched surfaces + `npm test`
- Band C removals:
  - Explicit approval per item
  - Full suite + schema commands (`c3spec schemas`, `c3spec schema validate <name>`) + init/update smoke checks

## Recommended next action

Band A removals have been applied:

- `README_OLD.md`
- `WORKSPACE_REIMPLEMENTATION_DIRECTION.md`
- `WORKSPACE_REIMPLEMENTATION_START_HERE.md`
- `openspec-parallel-merge-plan.md`

Post-removal validation: `npm test` passed (80 files, 1429 tests).

Band B removal applied:

- `MAINTAINERS.md`

Post-removal validation: `npm test` passed (80 files, 1429 tests).

Band C removals applied by explicit approval:

- `CHANGELOG.md`
- `flake.nix`
- `flake.lock`
- `scripts/update-flake.sh`
- `c3spec/specs/ci-nix-validation/`

Post-removal validation: `npm test` passed (80 files, 1429 tests).

Remaining approval-gated Band C surfaces (not removed): schema directories (`schemas/*`, `c3spec/schemas/superpowers-bridge/`).
