## 1. Canonical Lifecycle Contract

- [ ] 1.1 Add `.agents/skills/c3spec-tier-lifecycle/SKILL.md` as a reference skill that defines T1/T2/T3 folder conventions, required artifacts, optional artifacts, pause points, apply readiness, archive readiness, and fresh-context resume rules.
- [ ] 1.2 Register `c3spec-tier-lifecycle` in canonical skill enforcement surfaces (`REQUIRED_CANONICAL_SKILL_NAMES` and `scripts/check-canonical-skills.js`) so validation and host generation require it.
- [ ] 1.3 Add or update tests that fail when `c3spec-tier-lifecycle` is missing from the required canonical skill list or script-level check.

## 2. Tier Workflow Skill Updates

- [ ] 2.1 Update `.agents/skills/c3spec-tier1-fix/SKILL.md` so T1 creates a lightweight `c3spec/changes/tier1-<slug>/` folder with `tier.md`, `mini-plan.md`, `spec-impact.html`, `spec-impact.md`, `micro-retro.html`, and `micro-retro.md`.
- [ ] 2.2 Update `.agents/skills/c3spec-tier2-feature/SKILL.md` so T2 creates `tier.md`, uses `verify.md` / `retrospective.md` naming consistently, and consults `c3spec-tier-lifecycle` before archive.
- [ ] 2.3 Update `.agents/skills/c3spec-tier3-full/SKILL.md` so T3 creates `tier.md`, references `c3spec-tier-lifecycle`, and checks tier archive readiness before invoking archive.
- [ ] 2.4 Update `.agents/skills/c3spec-archive-change/SKILL.md` and related archive helper guidance so agent-driven archive checks required tier artifacts before running the CLI archive command.

## 3. Resume / Apply Helper Realignment

- [ ] 3.1 Update `.agents/skills/c3spec-continue-change/SKILL.md` to select a change, read `tier.md`, consult `c3spec-tier-lifecycle`, and report the next safe artifact, approval gate, implementation step, verification step, retrospective step, or archive step.
- [ ] 3.2 Update `.agents/skills/c3spec-apply-change/SKILL.md` to identify tier state from disk, verify required planning artifacts, read context files, and hand implementation to `c3spec-subagent-dev` instead of directly looping through tasks and marking checkboxes.
- [ ] 3.3 Update `.agents/skills/c3spec-host-adapter/SKILL.md` so Cursor dispatch instructions reflect native subagent role dispatch and do not require non-existent `.cursor/agents/<name>.md` files.

## 4. Spec Sync and Generated Artifact Drift

- [ ] 4.1 Sync approved delta specs into source specs (`workflow-routing`, `canonical-skills`, `cli-artifact-workflow`, `cli-archive`) after implementation decisions are reflected in skills.
- [ ] 4.2 Run host-generation or sync commands required by the repo so generated host artifacts stay aligned with `.agents/skills/`.
- [ ] 4.3 Verify no generated artifact drift remains after canonical skill edits.

## 5. Tests and Verification

- [ ] 5.1 Add tests that assert canonical skill validation includes `c3spec-tier-lifecycle`.
- [ ] 5.2 Add focused tests or text checks that assert resume/apply/archive helper skills reference `c3spec-tier-lifecycle`, `tier.md`, and `c3spec-subagent-dev` where required.
- [ ] 5.3 Add or update tests for host-adapter wording so Cursor dispatch no longer depends on `.cursor/agents/<name>.md`.
- [ ] 5.4 Run `pnpm check:canonical-skills`, `pnpm test`, and any build/typecheck commands required by changed code.
- [ ] 5.5 Include cross-platform path considerations in verification; any tests that construct paths must use Node `path` helpers rather than hardcoded separators.

## 6. Change Completion

- [ ] 6.1 Write `verify.md` with commands run, outcomes, spec sync status, generated artifact drift checks, and residual risks.
- [ ] 6.2 Write `retrospective.html`, present it for review, then save `retrospective.md`.
- [ ] 6.3 Capture memory if the retrospective identifies a generalizable workflow learning.
- [ ] 6.4 Archive `tier-workflow-resumability` and finish the branch according to the user's chosen integration path.
