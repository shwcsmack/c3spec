## Context

c3spec workflows are implemented primarily in canonical skills under `.agents/skills/`. The CLI artifact graph exists and works for schema-backed changes, but the tier skills already define richer behavior than the schema can express: HTML review gates, human approvals, worktree setup, subagent dispatch, verification, retrospective, and memory capture.

This design keeps tier behavior in the canonical skill layer and uses CLI support only where it already exists or where a small validation check is useful. A full schema migration for T1/T2/T3 is explicitly deferred.

## Goals / Non-Goals

**Goals:**

- Define one canonical lifecycle contract for T1/T2/T3 artifact sets.
- Make Tier 1 produce a durable, lightweight change folder.
- Make `c3spec-continue-change` and `c3spec-apply-change` safe in fresh context.
- Add a visible readiness check before archive/completion.
- Update specs and tests so drift is caught later.

**Non-Goals:**

- No full rewrite of workflow schemas into CLI YAML.
- No richer staged `tasks.md` schema beyond what apply/resume needs.
- No mandatory context reset implementation.
- No cleanup of pre-fork archived changes.

## Decisions

### D1: Canonical Lifecycle Contract

- **Choice:** Add a new required reference skill: `c3spec-tier-lifecycle`.
- **Reason:** This skill is not a workflow entry point. It is a shared contract that tier skills, resume helpers, apply helpers, archive helpers, and reviewers consult. It defines tier identity and change folder conventions, required and optional artifacts per tier, pause points and human approval gates, apply readiness and archive readiness, and fresh-context resume rules. A required canonical skill is already supported by the host-generation and validation pipeline and can be referenced consistently by agents.
- **Alternatives considered:** Put the contract only in `c3spec-start`. Rejected because resume/apply can be invoked without rerunning start, and the contract would be too easy to miss in fresh context. Machine-readable tier YAML/JSON is deferred because this pass does not need a new config parser or generated artifact pipeline.

### D2: Tier Artifact Sets

- **Choice:** Every tier gets a markdown durable record, even when HTML is used for review.
- **Reason:** Markdown artifacts are durable and diffable. HTML files remain review surfaces, but they are not the only record.

Tier 1:

- Folder: `c3spec/changes/tier1-<slug>/`
- Required: `tier.md`, `mini-plan.md`, `spec-impact.html`, `spec-impact.md`, `micro-retro.html`, `micro-retro.md`
- Optional: memory entry reference

Tier 2:

- Folder: `c3spec/changes/tier2-<slug>/`
- Required: `tier.md`, `proposal.md`, `tasks.md`, `plan.md`, `verify.md`, `retrospective.md`
- Optional: `design.md`, delta specs, HTML review companions

Tier 3:

- Folder: `c3spec/changes/<slug>/`
- Required: `tier.md`, `brainstorm.md`, `proposal.md`, `design.md`, `specs/*/spec.md`, `tasks.md`, `plan.md`, `verify.md`, `retrospective.md`
- Optional: HTML review companions retained beside markdown

### D3: Tier Metadata

- **Choice:** Use `tier.md` as the human-readable metadata and resume anchor.
- **Reason:** Fresh agents can read one file first and understand what kind of workflow they are resuming. Markdown avoids adding a parser while still being easy to validate with simple skill/test checks.
- **Alternatives considered:** Use `.c3spec.yaml` for all tiers. Rejected for this pass because schema-backed status currently treats the schema as an artifact graph. T1 and T2 need lifecycle metadata, not a forced fake graph.

Each `tier.md` starts with:

- Tier: `1`, `2`, or `3`
- Change slug and branch
- Goal / scope summary
- Status: planning, implementation, verifying, retrospective, ready-to-archive, archived
- Required artifacts checklist
- Affected specs

### D4: Resume Helper Behavior

- **Choice:** `c3spec-continue-change` becomes tier-aware, but remains conservative.
- **Reason:** The helper should prefer safety over automation. If it cannot determine the next step from disk, it asks one clarifying question rather than guessing.

The helper flow is:

1. Choose a change folder via explicit name or structured host question.
2. Read `tier.md`; fall back to folder/artifact inference only with a warning.
3. Read the required artifact checklist; use `c3spec status` for schema-backed T3/T2 when useful.
4. Report the next safe action: create artifact, wait for approval, implement, verify, retro, or archive.
5. Create at most one artifact or hand off; do not silently skip human gates.

### D5: Apply Helper Behavior

- **Choice:** `c3spec-apply-change` delegates implementation to `c3spec-subagent-dev`.
- **Reason:** Checkbox ownership and two-stage review already live in `c3spec-subagent-dev`. Duplicating task execution in apply would recreate drift.

The apply helper should:

- select and identify the change and tier,
- verify required planning artifacts exist for that tier,
- read context artifacts and task/plan files,
- detect blocked / ready / all-done state,
- invoke `c3spec-subagent-dev` with the tier, plan, and relevant memory context.

### D6: Archive Readiness Check

- **Choice:** Implement readiness primarily in skills, with tests that lock the contract.
- **Reason:** This satisfies the "CLI/skill check" goal through a skill-level readiness check while avoiding a larger CLI schema migration. Tests can assert the required skill references and lifecycle content so future edits do not remove the check.
- **Deferred:** A future CLI command like `c3spec verify-lifecycle --change <name>`. That becomes attractive after the lifecycle contract proves stable.

The tier lifecycle skill defines archive readiness. Tier skills and `c3spec-archive-change` must consult it before calling the CLI archive command. The CLI archive command remains focused on moving folders and syncing specs; it is not forced to understand every tier in this pass.

### D7: Host Adapter Correction

- **Choice:** Update `c3spec-host-adapter` to describe current Cursor dispatch accurately.
- **Reason:** The existing host adapter says Cursor dispatches named agents via generated files under `.cursor/agents/<name>.md`, but in this Cursor environment the roles are exposed as native subagent types (`implementer`, `spec-reviewer`, and `quality-reviewer`) rather than repo-local generated files. The adapter should describe the role mapping without requiring non-existent paths.

## Risks / Trade-offs

- **Risk:** Adding a new required skill increases the canonical surface.
  - **Mitigation:** Accepted because it creates a single durable contract and fits the existing host-generation validation model.
- **Risk:** Markdown `tier.md` is less machine-checkable than JSON/YAML.
  - **Mitigation:** Use simple required headings/checklists now; defer parser work until the contract stabilizes.
- **Risk:** Skill-level archive checks can still be bypassed by running `c3spec archive` directly.
  - **Mitigation:** Accept for this pass. The c3spec workflow routes agents through skills; CLI hard enforcement is a follow-up if bypasses become common.
- **Risk:** Existing active or archived pre-fork changes may not satisfy the new contract.
  - **Mitigation:** Apply the lifecycle contract prospectively to tier workflows; do not retroactively fail old upstream residue.
- **Risk:** Added tests that call the CLI may slow the suite.
  - **Mitigation:** Use focused tests and the existing vitest timeout constraint. Avoid repeated `runCLI` calls where direct unit tests can validate skill content.

## Migration Plan

1. Add `c3spec-tier-lifecycle` under `.agents/skills/` and register it in canonical skill validation.
2. Update specs for `workflow-routing`, `canonical-skills`, `cli-artifact-workflow`, and `cli-archive`.
3. Update tier skills to create `tier.md`, required markdown artifacts, and archive readiness checks.
4. Update continue/apply helpers to consult the lifecycle contract and route safely from disk state.
5. Update host adapter wording for Cursor subagent dispatch.
6. Add tests for canonical skill presence, lifecycle references, helper drift, and any minimal CLI/artifact behavior needed.
7. Run `pnpm check:canonical-skills`, `pnpm test`, and generated artifact drift checks.

Rollback: revert the branch before archive. No persisted data, DB, external APIs, or package dependencies are affected.

## Open Questions

None blocking. The design intentionally picks a skill-level lifecycle contract now and defers CLI hard enforcement until the contract is proven through one or two workflow cycles.
