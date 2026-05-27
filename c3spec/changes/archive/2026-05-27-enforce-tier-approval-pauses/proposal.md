# Proposal: enforce-tier-approval-pauses

## Why

Tier workflows currently have inconsistent pause behavior and inconsistent HTML-to-markdown handoff timing. This reduces user trust in approvals, causes artifact drift, and weakens fresh-context resumability.

The lifecycle contract already exists as the intended single source of truth, so this change formalizes and enforces pause and handoff behavior there and aligns all tier/resume consumers.

## What Changes

1. Canonicalize pause behavior in `c3spec-tier-lifecycle` and remove contradictory local interpretations in tier/resume skills.
2. Make `tasks.md` and `plan.md` explicitly non-pausing artifacts.
3. Make `verify.md` non-blocking unless verification fails.
4. Require HTML review in Tier 3 for proposal, design, and retrospective.
5. Keep HTML optional in Tier 1 and Tier 2, but enforce ordering when used: HTML -> approval -> durable markdown.
6. Define `fast forward` as skipping approval pauses and HTML generation.
7. Define default `fast forward` scope as running through retrospective unless narrower scope is requested.
8. Require `fast forward` to stop after retrospective creation for human review before archive.
9. Treat clear natural-language affirmative responses as approval.

## Impact

- Skills in scope: `c3spec-tier-lifecycle`, `c3spec-tier1-fix`, `c3spec-tier2-feature`, `c3spec-tier3-full`, `c3spec-continue-change`.
- Specs likely in scope: `workflow-routing`, `canonical-skills`.
- Tests in scope: focused lifecycle and skill-contract coverage in `test/specs/`.
- Out of scope: unrelated CLI command surfaces and non-lifecycle workflow behavior.
