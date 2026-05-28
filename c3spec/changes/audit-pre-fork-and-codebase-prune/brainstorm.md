# Brainstorm: audit-pre-fork-and-codebase-prune

## Problem framing
`c3spec/changes/` included a large inherited archive surface that made active history harder to scan and made audits noisy.

## Scope
- Classify active and archived change folders by provenance.
- Hard-delete confirmed pre-fork archive entries.
- Keep c3spec-era archive entries.
- Remove or update stale references that no longer match retained history.

## Non-goals
- Rewriting all historical specs.
- Deleting active c3spec-era change folders.
- Broad refactors outside history hygiene.

## Options considered
1. Keep everything and only relabel.
2. Move pre-fork entries into a separate sub-archive.
3. Hard-delete pre-fork entries and keep c3spec-era entries.

## Recommended direction
Option 3 (`hard delete`) per user policy, with a date-bucket cutoff aligned to idea #10 language (through `2026-04-23`) and quick post-delete validation.

## Risks and mitigations
- Risk: delete c3spec-era artifacts by mistake.
  - Mitigation: keep all archive entries `>= 2026-05-04`; keep all active root change folders.
- Risk: command behavior changes unexpectedly.
  - Mitigation: run `c3spec list` and test suite after deletions.
