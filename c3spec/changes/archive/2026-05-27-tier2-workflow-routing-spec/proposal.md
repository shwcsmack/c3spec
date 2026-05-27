## Why

The tier workflow is one of c3spec's core product contracts, but today it is spread across `CLAUDE.md`, `AGENTS.md`, generated instruction source, and six skill files. Other stable behaviors in the repo are documented under `c3spec/specs/`; routing is not. Capturing it as a behavior-first spec gives future workflow changes a shared target and reduces drift between instructions, skills, tests, and generated host artifacts.

## What Changes

**Workflow routing contract**
- From: The tier contract is documented in instructions and skill prose only.
- To: The tier contract is documented as a new `workflow-routing` capability under `c3spec/specs/`.
- Reason: Future workflow changes need a stable behavioral reference point.
- Impact: Non-breaking documentation/spec addition.

**Tier set and entry path**
- From: The three-tier model and `c3spec-start` entry path are implied by `c3spec-start` and host instruction blocks.
- To: The spec explicitly defines `c3spec-start` as the single front door and T1/T2/T3 as the supported routing outcomes.
- Reason: The routing classifier contract should be reviewable without reading every skill file.
- Impact: Clarifies existing behavior without changing it.

**Canonical skills and review agents**
- From: Canonical skill and review-agent surfaces are enforced by constants/tests but not described in a workflow spec.
- To: The spec names those surfaces at behavior level.
- Reason: The spec should describe the workflow participants that must exist for the contract to hold.
- Impact: No code change.

**Spec/test enforcement**
- From: No project-wide requirement-to-test coverage convention exists.
- To: This change stays docs-only; project-wide enforcement is deferred to IDEAS.md #15.
- Reason: New-test-per-requirement enforcement needs its own design and migration path across all specs.
- Impact: No new tests or CI checks in this change.

## Capabilities

### New Capabilities
- `workflow-routing`: Defines the c3spec tier workflow contract, including the front-door interview, routing classifier behavior, tier-specific workflow shape, canonical skill/agent surfaces, and expected enforcement boundaries.

### Modified Capabilities
- None.

## Impact

- `c3spec/changes/tier2-workflow-routing-spec/specs/workflow-routing/spec.md`: Add delta spec for the new capability.
- `c3spec/specs/workflow-routing/spec.md`: Created when the change is archived.
- `.agents/skills/*`, `src/core/host-generation/*`, tests: No changes in this docs-only pass.
- `IDEAS.md`: Already updated on `main` with #15 for future all-spec requirement/test enforcement.

## Non-Goals

- No new test or CI enforcement for requirement-to-test mapping.
- No edits to tier skills, generated host instructions, `CLAUDE.md`, or `AGENTS.md`.
- No change to T1's current inline/no-change-folder behavior.
- No richer `tasks.md` schema work; that remains a separate backlog item.
