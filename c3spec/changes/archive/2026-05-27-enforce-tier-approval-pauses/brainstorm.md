# Brainstorm: enforce-tier-approval-pauses

## Problem Framing

Tier workflows are inconsistent about when they pause for human approval and when they convert HTML review artifacts into durable markdown records. This causes flow drift, weakens review trust, and makes lifecycle state harder to resume safely from disk.

## Why Now

Workflow reliability is now a core product behavior for c3spec. Pause semantics and artifact handoff are cross-tier contract concerns, so they should be explicit, centralized, and testable before additional workflow ideas build on top of them.

## Scope

- Define and enforce pause-point behavior per tier through `c3spec-tier-lifecycle`.
- Define and enforce HTML-to-markdown handoff sequencing.
- Define `fast forward` semantics, default range, and stop conditions.
- Keep resume/apply/archive behavior aligned with the updated lifecycle contract.

## Non-Goals

- Changing implementation details of unrelated command surfaces.
- Redesigning task-generation schema beyond pause semantics.
- Introducing host-specific UI picker requirements in this change.

## Decisions Captured From Interview

1. `tasks.md` and `plan.md` should not be approval pause gates.
2. `verify.md` is non-blocking unless verification fails.
3. HTML review is required in Tier 3 and optional in Tier 1/Tier 2.
4. When HTML is used, sequence must be: HTML generated -> human review/approval -> durable markdown saved.
5. `fast forward` skips both approval pauses and HTML generation.
6. `fast forward` default scope runs through retrospective unless explicitly narrowed.
7. `fast forward` stops after retrospective artifact creation for human review before archive.
8. Approval detection uses clear natural-language affirmatives (not strict keyword-only matching).

## Candidate Contract Shape

- Tier 3 required HTML review artifacts: `proposal.html`, `design.html`, `retrospective.html`.
- Tier 1/Tier 2 optional HTML companions: if present, enforce the same handoff sequence.
- Markdown durable artifacts remain source of lifecycle truth.
- Pause points become policy-driven from lifecycle contract, not locally restated in each tier skill.

## Risks and Unknowns

- Existing tier skill prose may contain contradictory local rules that must be removed or tightened.
- Resume helpers may need explicit handling for a fast-forward active state and its stop-at-retro boundary.
- Approval interpretation in natural language must remain predictable enough across hosts.

## Recommended Direction

Update `c3spec-tier-lifecycle` first with canonical pause and handoff semantics, then align T1/T2/T3 skills plus `c3spec-continue-change` and relevant focused tests so behavior cannot regress silently.
