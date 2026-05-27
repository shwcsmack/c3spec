---
name: tier-lifecycle-contract-ownership
description: Tier workflow lifecycle behavior should be centralized in c3spec-tier-lifecycle and consumed by tier/resume/apply/archive skills.
category: workflow
tags: [tier-workflows, lifecycle, skills, resumability, archive-readiness]
source-change: tier-workflow-resumability
date: 2026-05-27
status: active
---

# Tier Lifecycle Contract Ownership

## Context

The `tier-workflow-resumability` change added `c3spec-tier-lifecycle` as the shared contract for T1/T2/T3 change folders, required artifacts, pause points, apply readiness, archive readiness, and fresh-context resume behavior.

During implementation, review caught several contradictions when individual skills re-stated lifecycle rules locally:

- T1 initially missed the `planning` -> `implementation` status transition before subagent execution.
- T2 initially treated HTML companions as mandatory even though the lifecycle contract made them optional.
- Archive helpers initially treated incomplete tier task progress as a warning instead of a readiness blocker.
- Focused tests initially checked resume/apply/archive helpers but missed tier workflow skills as lifecycle consumers.

## Learning

Tier lifecycle behavior should be centralized in `c3spec-tier-lifecycle`. Tier, resume, apply, and archive skills should act as consumers of that contract rather than defining their own independent artifact and readiness rules.

When updating tier workflows:

- Update `c3spec-tier-lifecycle` first.
- Update T1/T2/T3 skills as orchestrators over the lifecycle contract.
- Update resume/apply/archive helpers in the same stage when lifecycle semantics affect status, task progress, or archive readiness.
- Add focused text tests that assert each consumer references the lifecycle contract and the key handoff points it owns.

## Application

Use this memory whenever planning changes to:

- `c3spec-tier1-fix`
- `c3spec-tier2-feature`
- `c3spec-tier3-full`
- `c3spec-continue-change`
- `c3spec-apply-change`
- `c3spec-archive-change`
- `c3spec-bulk-archive-change`
- `c3spec-host-adapter`

If a future workflow change needs a new lifecycle rule, avoid patching it into only one tier skill. Put the rule in `c3spec-tier-lifecycle`, then update consumers and tests together.
