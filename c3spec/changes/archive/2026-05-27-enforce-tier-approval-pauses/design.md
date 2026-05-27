# Design: enforce-tier-approval-pauses

## Overview

This change standardizes pause-gate and artifact-handoff behavior across T1/T2/T3 by defining policy in `c3spec-tier-lifecycle` and making tier/resume skills consume it consistently.

## Decisions

1. Lifecycle contract is the canonical owner of pause and handoff semantics.
2. `tasks.md` and `plan.md` are explicitly non-pausing artifacts.
3. `verify.md` is non-blocking unless verification fails.
4. Tier 3 requires HTML review artifacts for proposal, design, and retrospective.
5. Tier 1 and Tier 2 may use optional HTML companions; if used, ordering is strict:
   - Generate HTML
   - Surface review path and wait for approval
   - Save durable markdown record
6. `fast forward` semantics:
   - Skip approval pauses
   - Skip HTML generation
   - Default scope runs through retrospective unless narrower scope is specified
   - Stop after retrospective generation for human review before archive
7. Approval interpretation accepts clear natural-language affirmatives.

## Affected Surfaces

- `c3spec-tier-lifecycle` (contract)
- `c3spec-tier1-fix`, `c3spec-tier2-feature`, `c3spec-tier3-full` (consumers)
- `c3spec-continue-change` (resume behavior)
- Workflow-facing docs (`AGENTS.md`, `CLAUDE.md`)
- Focused tests in `test/specs/`

## Flow Model

### HTML-in-scope artifact

1. Generate `*.html`
2. Request review
3. On approval, write durable `*.md`

### Markdown-only artifact

1. Write durable `*.md`
2. Continue unless lifecycle marks a pause gate

### Fast-forward mode

1. Use markdown-only path
2. Skip pause gates until retrospective
3. Stop after retrospective and require review before archive

## Risks and Mitigations

- Risk: lifecycle and tier skill prose diverges again.
  - Mitigation: lifecycle-first edits plus focused skill-contract tests.
- Risk: resume behavior becomes ambiguous under fast-forward.
  - Mitigation: encode deterministic stop-at-retro behavior in resume helper guidance.
- Risk: approval interpretation too permissive.
  - Mitigation: require clear affirmative meaning, not silence or unrelated responses.
