# Fork Residue Cleanup via Risk Bands

## Context

Large fork-residue cleanup in c3spec required deleting docs/history/release surfaces while preserving active runtime/schema systems.

## Learning

Use a three-band model:
- Band A: safe removals (no active refs)
- Band B: likely removals with targeted validation
- Band C: high-coupling/runtime-facing removals requiring explicit per-item approval

This structure enables aggressive cleanup with low breakage risk.

## Applied in

- `c3spec/changes/codebase-audit-cleanup/`
