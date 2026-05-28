# Design: Archive Provenance Cleanup

## Decision
Use deterministic date-prefix classification for archive folders:
- Delete: `YYYY-MM-DD <= 2026-04-23`
- Keep: `YYYY-MM-DD >= 2026-05-04`

## Why
Idea #10 explicitly identified the pre-fork bucket ending on `2026-04-23`. This allows a deterministic execution path without relying on ambiguous folder authorship metadata.

## Procedure
1. Enumerate archive folder names.
2. Select delete set by date-prefix comparison.
3. Delete selected folders.
4. Validate retained set and active roots.
5. Remove stale cross-reference docs tied to deleted entries.

## Rollback
Restore deleted folders from git history if a retained folder was misclassified.

## Risks
- Date-prefix assumptions could misclassify a corner case.
- Some exploratory docs may still mention removed entries.
