# Design: codebase-audit-cleanup

## Decision 1: Evidence-first audit pipeline (chosen)

- **Approach:** Build a deterministic inventory from repo scanning + reference tracing before deletion.
- **Why:** Prevents accidental removal of active surfaces, especially schema/template and runtime command paths.
- **Alternatives considered:**
  - Direct deletion sweep (rejected: too risky)
  - Metadata-only cleanup (rejected: insufficient scope)

## Decision 2: 3-band risk classification (chosen)

- **Band A:** no runtime/test references; safe deletions.
- **Band B:** likely removable with proof + targeted validations.
- **Band C:** runtime-facing/high-coupling removals requiring explicit user approval per item.

## Decision 3: Two-phase execution (chosen)

- **Phase 1:** Produce audit artifacts and candidate matrix.
- **Phase 2:** Execute cleanup in staged bands with verification gates.

## Architecture / Flow

1. Enumerate surfaces: runtime, commands, scripts, schemas, docs, metadata, packaging.
2. Trace references via ripgrep/tests/config/package entrypoints.
3. Classify each candidate into Keep / Band A / Band B / Band C.
4. Generate tasks and staged implementation plan from approved classification.
5. Apply Band A first, Band B second, Band C only with explicit approvals.

## Data/Contract impacts

- `package.json`: possible changes to `files`, scripts, dependencies, metadata.
- Schema/template contracts: possible consolidation decisions across `schemas/` and `c3spec/schemas/`.
- Skill/host artifact contracts: preserve canonical-source rules under `.agents/`.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Removing active schema/template surface | Reference tracing + schema/CLI/test validations before merge. |
| Breaking host artifact generation | Run canonical/host generation checks and full tests post-change. |
| Deleting docs still referenced by user flows | Doc-link scan and README navigation review before deletion. |
| Dependency pruning causing hidden runtime/test failures | Band-specific validation matrix + full test suite at end. |

## Rollout

- Checkpoint after audit matrix completion for user approval.
- Checkpoint before any Band C deletion.
- Finalize with verify + retrospective + memory capture.

## Open questions

- Whether to merge/remove root `schemas/` after confirming consumers.
- Whether to retain long-form historical docs as archive references or remove entirely.
