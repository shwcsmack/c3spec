## Why

c3spec's tiered workflow now routes development through T1, T2, and T3, but its durable artifact story is inconsistent. T1 says it has no change directory while still writing review artifacts under `c3spec/changes/`; T2 and T3 create different artifact sets; and the resume helpers still assume the pre-tier artifact sequence. This makes the workflow harder to audit and unsafe to resume from a fresh agent context. We need a small, explicit tier lifecycle contract so every tier leaves enough on-disk evidence to continue, verify, and archive without relying on chat memory.

## What Changes

**Tier artifact lifecycle**
- From: Tier artifact sets are described separately in prose, and T1 contradicts itself about change folders.
- To: Each tier has a canonical artifact contract: required artifacts, optional artifacts, pause points, completion criteria, and archive readiness.
- Reason: Resume, apply, verify, and archive need a shared contract rather than scattered prose.
- Impact: Non-breaking clarification that tightens future workflow execution.

**Tier 1 audit trail**
- From: T1 avoids a registered change directory but writes HTML artifacts under a tier-specific path.
- To: T1 gets a lightweight, explicit change folder and completion record suitable for fresh-context resume and archive checks.
- Reason: Without a folder, fresh-context resume is impossible and archive/completion checks cannot be uniform.
- Impact: Workflow change for fixes; no full proposal/design ceremony.

**Resume helper behavior**
- From: `c3spec-continue-change` walks schema artifacts and references retired generic patterns.
- To: `c3spec-continue-change` identifies tier state and directs the agent to the next artifact, approval gate, or blocked condition.
- Reason: Current tier workflows have approval gates, HTML review artifacts, and Tier 1 special cases that generic schema walking cannot infer safely.
- Impact: Non-breaking improvement to paused workflow recovery.

**Apply helper behavior**
- From: `c3spec-apply-change` loops through tasks itself and marks checkboxes directly.
- To: `c3spec-apply-change` uses on-disk context, respects tier pause points, and hands implementation to `c3spec-subagent-dev` so checkbox ownership and reviews stay consistent.
- Reason: The canonical implementation workflow now centralizes dispatch, review, and checkbox discipline in `c3spec-subagent-dev`.
- Impact: Non-breaking alignment with the canonical subagent workflow.

**Archive/completion discipline**
- From: Archive mostly checks tasks completion and spec sync, with no tier-specific required artifact validation.
- To: The workflow gains a visible check path that fails or warns when a tier is called complete without its required artifacts or archive step.
- Reason: The audit trail only matters if completion and archive are enforced.
- Impact: Guardrail against incomplete change records being treated as done.

## Capabilities

### New Capabilities

None expected. This change tightens existing workflow, canonical skill, artifact workflow, and archive contracts rather than creating a new product capability.

### Modified Capabilities

- `workflow-routing`: Tier workflow shape changes: T1 gains a durable lightweight change folder; all tiers gain explicit artifact/pause/archive contracts.
- `canonical-skills`: Resume helper requirements become tier-aware and fresh-context-safe; host-adapter wording should match actual Cursor subagent dispatch.
- `cli-artifact-workflow`: Status/instructions behavior may need to expose enough tier context or artifact readiness to support resume helpers without guessing.
- `cli-archive`: Archive/readiness expectations should account for tier-required artifacts, not just task checkbox state.

## Impact

- Canonical skills: `.agents/skills/c3spec-tier1-fix/SKILL.md`, `.agents/skills/c3spec-tier2-feature/SKILL.md`, `.agents/skills/c3spec-tier3-full/SKILL.md`, `.agents/skills/c3spec-continue-change/SKILL.md`, `.agents/skills/c3spec-apply-change/SKILL.md`, and `.agents/skills/c3spec-host-adapter/SKILL.md`.
- Specs: delta specs under `c3spec/changes/tier-workflow-resumability/specs/` for the modified capabilities listed above.
- CLI/tests: likely `src/cli/index.ts`, artifact workflow helpers, archive command tests, or skill validation tests, kept minimal unless required for enforcement.
- Generated artifacts: host-generated copies or validation fixtures may need drift checks after canonical skill edits.
- Risk: existing archived/pre-fork changes should not be required to satisfy new tier contracts in this pass.
