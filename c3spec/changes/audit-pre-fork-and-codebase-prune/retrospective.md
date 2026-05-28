# Retrospective

## What worked
- Deterministic pruning policy (date cutoff + bootstrap-commit provenance) made cleanup auditable.
- Keeping a strict retained set preserved current c3spec-era active/archive history.

## What did not work
- Initial pass under-classified bootstrap-imported legacy folders.
- Workspace workflow assertions were initially too strict about exact workflow ID sets.

## Process improvements
- For imported forks, provenance should check bootstrap-imported folders explicitly, not just current path-local commit dates.
- Add a reusable audit script that emits `legacy|c3spec|ambiguous` before deletion.

## Memory decision
- Generalizable: yes (fork-bootstrap provenance rule).
- Memory entry added: `c3spec/memory/workflow/fork-bootstrap-provenance-classification.md`.
