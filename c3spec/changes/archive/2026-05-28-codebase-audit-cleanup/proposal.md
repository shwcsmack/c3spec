# Proposal: codebase-audit-cleanup

- Date: 2026-05-27
- Tier: 3
- Branch: `feat/codebase-audit-cleanup`

## Why

The repository likely retains upstream/fork residue across docs, schema/template systems, metadata, dependencies, and command/runtime surfaces. This increases maintenance cost and cognitive load and makes future changes harder and riskier.

## What Changes

| Before | After |
| --- | --- |
| Cleanup candidates are implicit and scattered. | Single evidence-backed inventory of candidates with keep/remove rationale. |
| Risk levels are mixed, making deletion sequencing unclear. | Three-band risk model (A/B/C) with explicit validation per band. |
| Potential runtime/schema coupling is uncertain. | Reference tracing documents active consumers and blast radius per candidate. |
| High-risk deletions could be applied accidentally. | Explicit gate: no Band C deletion without direct user approval item-by-item. |

## New Capabilities

- Repeatable cleanup methodology for future audits (inventory + risk bands + validation matrix).
- Staged execution plan enabling safe incremental repository slimming.
- Decision record for ambiguous legacy surfaces (keep, fold-in, or remove).

## Deliverables

1. Inventory matrix (file/path, owner surface, references, candidate action).
2. Per-item keep/remove rationale with confidence and risk band.
3. Banded execution sequence (A first, then B, then approved C).
4. Validation command set per band (tests/commands/checks required).

## Impact

- **Specs:** likely updates to cleanup/workflow/spec-related capabilities after decisions.
- **Skills:** possible updates if schema/template ownership shifts.
- **Commands/Runtime:** possible pruning of unused command surfaces and scripts.
- **Dependencies:** potential removal of unused direct dependencies/devDependencies.
- **Tests:** expected updates where removed surfaces are currently covered.
- **Docs/Metadata:** likely removal/merge of stale upstream-era documentation.
