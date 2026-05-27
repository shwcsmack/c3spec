# Brainstorm: Tier Workflow Resumability

Combined Tier 3 change for IDEAS #7 and #15. Branch: `feat/tier-workflow-resumability`. Change: `tier-workflow-resumability`.

## Problem Framing

c3spec now has tiered workflows, but the artifact lifecycle and resume helpers still carry pre-tier assumptions. Tier 2 and Tier 3 produce structured change folders, but Tier 1 is contradictory: the skill says not to create a change directory while later writing HTML artifacts under `c3spec/changes/tier1-...`. At the same time, `c3spec-continue-change` and `c3spec-apply-change` still assume the old schema-driven flow and do not understand current Tier 1 / Tier 2 / Tier 3 pause points.

The result is an auditability and resumability gap: a human can pause, a fresh agent can return later, and the on-disk artifacts may not be enough to recover the workflow safely.

## Current Facts

- `c3spec new change` creates a `superpowers-bridge` sequence: brainstorm, design, proposal, specs, tasks, plan, verify, retrospective.
- Tier 3 skill sequence is brainstorm, proposal, design, specs, tasks, plan, verify, retrospective.
- Tier 2 skill creates a compact, partly ad-hoc folder: proposal, optional design, tasks, plan, retro.
- Tier 1 writes spec-impact and micro-retro HTML artifacts, but has no registered change.

## Relevant Memory

- Canonical skills live under `.agents/skills/`; do not reintroduce root `skills/`.
- Resume helpers are intentionally canonical because they support fresh-context handoffs after pauses.
- Subprocess-heavy tests need the current vitest timeout headroom; do not lower it while adding tests.

## Success Shape

- Every tier has an explicit artifact set and completion contract.
- Every tier leaves a durable on-disk trail that a fresh agent can resume from.
- Resume/apply helpers are tier-aware enough not to follow retired artifact sequences.
- Archive/completion checks fail clearly when required artifacts are missing.

## Decision Chain

| Question | Decision | Reason |
| --- | --- | --- |
| Do #7 and #15 belong together? | Yes, one Tier 3 change. | Resume helpers need stable tier artifact contracts. Fixing the helpers before fixing T1/T2/T3 artifact discipline would encode more drift. |
| Should T1 get a real change folder? | Yes, lightweight and registered. | Without a folder, fresh-context resume is impossible and archive/completion checks cannot be uniform. |
| Should resume helpers remain generic schema walkers? | No, make them tier-aware at the workflow layer. | The current tier skills are the canonical product workflow. Schema status is useful, but not enough to know human approval gates, HTML review, subagent dispatch, or Tier 1 special cases. |
| Should archive be mandatory? | Yes, through explicit verification/checks. | The audit trail only matters if completion and archive are enforced, not aspirational. |

## Approaches Considered

### Option A: Patch only the resume helpers

Update `c3spec-continue-change` and `c3spec-apply-change` to mention current tiers, but leave Tier 1 without a registered folder and leave artifact contracts implicit.

Trade-off: fastest, but preserves the root ambiguity. Fresh-context resume would still have to guess what Tier 1 means.

### Option B: Define tier artifact contracts, then realign helpers

Make each tier declare a canonical folder shape, required artifacts, optional artifacts, pause points, completion criteria, and archive behavior. Then rewrite resume/apply helpers to detect tier state and route to the next safe action.

Trade-off: medium-sized but coherent. This is the recommended path.

### Option C: Move everything fully into CLI schemas

Encode Tier 1 / 2 / 3 artifact sequences entirely in schema definitions and make the skills dumb wrappers around `c3spec status` and `c3spec instructions`.

Trade-off: architecturally tidy long-term, but too large for this pass. It would touch schema loaders, templates, skills, CLI validation, and all existing change folders.

## Recommended Direction

Use Option B: define a small tier lifecycle contract and realign the helpers around that contract.

1. Define required artifacts, optional artifacts, pause points, and archive readiness for T1/T2/T3.
2. Give Tier 1 a lightweight registered folder, likely `c3spec/changes/tier1-<slug>/`.
3. Update `c3spec-continue-change` to identify next artifact or human approval gate by tier.
4. Update `c3spec-apply-change` to read plan/tasks and dispatch through `c3spec-subagent-dev`.
5. Add checks/tests so missing artifacts or stale helper guidance fail before archive/completion.

## Scope

### In Scope

- Update canonical skills under `.agents/skills/` only.
- Define Tier 1 / 2 / 3 artifact sets and pause/resume behavior in one canonical place.
- Update `c3spec-tier1-fix`, `c3spec-tier2-feature`, `c3spec-tier3-full`, `c3spec-continue-change`, and `c3spec-apply-change`.
- Update `c3spec-host-adapter` if needed so it reflects Cursor's actual subagent mechanism.
- Add at least one verification path: tests, CLI check, or explicit skill validation that catches missing required artifacts.

### Out of Scope

- Full schema-system rewrite for all tiers.
- IDEAS #9 richer tasks schema, except where minimum task shape affects resume/apply.
- IDEAS #10 mandatory context reset, though the handoff contract should be compatible with it.
- IDEAS #12 pre-fork cleanup, even if stale archived changes make testing noisier.

## Key Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Overbuilding a CLI lifecycle engine when skill updates are enough. | Keep this pass focused on explicit contracts and minimal checks. Defer full schema migration. |
| Breaking existing archived change behavior. | Scope checks to active changes and new tier folders unless archival compatibility is explicitly required. |
| Resume helpers still depend on chat memory. | Require enough tier metadata and artifact files on disk for fresh-context resume. |
| Tests become slow because CLI helpers spawn subprocesses. | Use the existing 30s vitest timeout constraint; keep added tests focused and avoid unnecessary repeated `runCLI` calls. |

## Open Questions for Design

- What is the exact Tier 1 artifact set? Minimum likely: `notes.md` or `mini-plan.md`, `spec-impact.html/md`, `micro-retro.html/md`, plus optional memory link.
- Where should the tier contract live? Options: skill prose only, a small machine-readable sidecar under `.agents/`, or CLI schema metadata.
- Should archive checks be implemented as CLI behavior now, or as skill-level validation with tests around canonical skill content?
- How much should `c3spec-apply-change` execute itself versus dispatch back into the tier skill / `c3spec-subagent-dev`?
