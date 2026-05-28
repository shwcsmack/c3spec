# Design: pi-only-package-pivot

## Decision 1: pi-only host model (hard break)

- **Chosen:** c3spec supports pi as the sole runtime/host model.
- **Reason:** Maximizes pi-native UX and minimizes maintenance by removing cross-host abstractions.
- **Alternatives considered:** staged compatibility window (rejected due to maintenance carry).

## Decision 2: remove host-generation pipeline from core

- **Chosen:** remove/decommission Cursor/Claude/Codex host renderers, host ID enums, and generated-host artifact contracts from core runtime path.
- **Reason:** Primary success metric is total non-pi support removal.

## Decision 3: pi package as canonical distribution surface

- **Chosen:** package c3spec resources via pi package manifest/conventions, with pi-native resource loading expectations.
- **Reason:** Aligns delivery model with runtime strategy.

## Decision 4: pi-native capability uplift in same initiative

- **Chosen:** include bounded upgrades that leverage pi extensions/SDK/runtime in workflow orchestration.
- **Reason:** Goal is full pi-agent power, not only subtraction migration.

## Architecture / Flow

- Current: c3spec canonical -> host renderers (cursor/claude/codex) -> host artifacts
- Target: c3spec as pi package -> pi skills/extensions/runtime -> single runtime contract

## Contracts impacted

- Workflow routing spec becomes pi-only.
- Canonical skills contract removes non-pi host adapter semantics.
- Command/host-generation specs rewritten or retired where host-centric.
- Default instruction surfaces stop naming non-pi hosts.

## Risks and mitigations

- Broad deletion regressions -> staged implementation + compile/test checks per stage.
- Stale docs/spec references -> grep-based sweep + contract tests.
- Runtime behavior gaps post-removal -> pi-focused end-to-end verification.

## Rollout

1. Spec/docs contract update to pi-only.
2. Core code removal of non-pi host-generation/runtime surfaces.
3. Pi-native uplift additions and verification.

## Open questions

- Exact boundary between CLI-owned orchestration vs extension-owned orchestration in first cut.
- Whether any legacy host code remains behind internal flags for one release (assumed no).
