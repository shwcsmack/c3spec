# Brainstorm — codebase-audit-cleanup

## Problem framing

The repo appears to still contain mixed lineage surfaces from upstream OpenSpec/Superpowers-era structures, plus active c3spec-era systems. We need a high-confidence map of what is truly active versus removable residue before deletion.

## Why now

- Idea #1 explicitly calls out partially completed cleanup with high-risk residual removals.
- Current maintenance burden includes duplicate/legacy docs, mixed schema/template systems, and packaging metadata likely inherited from upstream.
- Aggressive cleanup without classification risks breaking CLI workflows, tests, or distribution.

## Scope

Full-repo audit including:
- Runtime code (`src/`, `bin/`, `scripts/`)
- Test coverage and fixtures (`test/`)
- Schema/template systems (`schemas/`, `c3spec/schemas/`)
- Docs and repo metadata (`README*`, maintainers/changelog/community/release residue)
- Packaging/distribution surface (`package.json`, `files`, dependencies, lockfiles)
- Generated/host artifacts and canonical source split (`.agents`, `.claude`, `.codex`, `.cursor`)

## Non-goals

- No blind high-risk deletions during discovery.
- No architecture redesign beyond what is necessary to support cleanup recommendations.

## Observations so far

- `c3spec/config.yaml` points to `schema: superpowers-bridge`; this is likely active.
- `c3spec/schemas/superpowers-bridge/` is large and still referenced in tests and core init defaults.
- Root `schemas/` also exists with overlapping templates, requiring active-vs-residue determination.
- Top-level metadata/docs include likely residue candidates (`README_OLD.md`, old workspace docs, maintainer/changelog surfaces).
- `.github/` appears absent, so release pipeline residue may already be partially removed.

## Options considered

1. Direct deletion sweep now
   - Pros: fast
   - Cons: high breakage risk; weak audit trail
2. Full inventory + risk-banded removal plan (recommended)
   - Pros: safe, reviewable, staged execution
   - Cons: more upfront work
3. Minimal metadata-only cleanup
   - Pros: low risk
   - Cons: misses runtime/dependency simplification

## Risk-banded model (approved direction)

- **Band A (safe):** clear residue with no runtime/test references.
- **Band B (likely removable):** low-to-medium risk; requires proof via grep + targeted tests.
- **Band C (high risk):** runtime-facing surfaces needing explicit approval and dedicated validation.

## Unknowns

- Whether root `schemas/` are still required by any command path or tests.
- Which docs are referenced by current README/navigation and should remain.
- Which dependencies are truly necessary after transitive/runtime checks.

## Recommended direction

Run an exhaustive evidence-based audit and produce a staged cleanup plan with explicit file-level candidates, impact analysis, and per-band validation requirements before deletion tasks begin.
