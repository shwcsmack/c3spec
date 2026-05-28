# Proposal: Audit Pre-Fork and Codebase Prune

## Why
The changes history included inherited upstream entries that reduced signal for c3spec contributors. We need a tighter, c3spec-native history surface and a follow-up cleanup of stale references.

## What changes
- Audit `c3spec/changes/` root and archive.
- Hard-delete archived entries dated `<= 2026-04-23`.
- Keep c3spec-era archived entries (`>= 2026-05-04`).
- Remove stale implementation-order narrative tied to removed historical entries.

## Impact
- Smaller archive footprint and faster human scanning.
- Less confusion during `c3spec list` and archive operations.
- No intended runtime behavior changes beyond filesystem content.

## Acceptance
- Pre-fork archive entries are removed.
- c3spec-era archive entries remain.
- Active root-level c3spec change folders remain.
- CLI core commands still run.
