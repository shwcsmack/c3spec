# Tier Workflow Resumability Implementation Plan

> Use `c3spec-subagent-dev` to execute this plan task-by-task. The controller owns `tasks.md` checkboxes and only marks them complete after implementation plus spec/quality review.

**Goal:** Make tier workflows auditable and resumable by adding a canonical tier lifecycle contract, making T1 produce a lightweight change folder, and realigning resume/apply/archive skills with that contract.

**Architecture:** Keep tier lifecycle semantics in canonical skills, not a new CLI schema system. Add `c3spec-tier-lifecycle` as a required reference skill, update tier/resume/apply/archive/helper skills to consult it, and add tests that lock required skill registration plus key helper references. CLI behavior stays backwards compatible for existing/pre-fork changes.

**Tech Stack:** TypeScript, Node.js ESM, pnpm, Vitest, canonical `.agents/skills/` pipeline.

---

## Stage 1 - Lifecycle Contract Foundation

### Task 1.1: Add `c3spec-tier-lifecycle` reference skill

**Files:**
- `.agents/skills/c3spec-tier-lifecycle/SKILL.md`

**Context:**
- Read `c3spec/changes/tier-workflow-resumability/design.md`, especially D1-D6.
- Read `c3spec/changes/tier-workflow-resumability/specs/workflow-routing/spec.md`.
- Read `c3spec/changes/tier-workflow-resumability/specs/canonical-skills/spec.md`.

**Steps:**
- Create `.agents/skills/c3spec-tier-lifecycle/SKILL.md` with frontmatter `name: c3spec-tier-lifecycle`.
- Make clear it is a reference skill, not a user-facing entry point.
- Define T1/T2/T3 folder conventions exactly as approved in design.
- Define required/optional artifacts for each tier.
- Define pause points, apply readiness, archive readiness, and fresh-context resume rules.
- Include a section for "How other skills use this" that names `c3spec-tier1-fix`, `c3spec-tier2-feature`, `c3spec-tier3-full`, `c3spec-continue-change`, `c3spec-apply-change`, `c3spec-archive-change`, and `c3spec-bulk-archive-change`.

**Verification:**
- Read the file and confirm frontmatter parses visually.
- Confirm every required tier artifact from `design.md` appears in the skill.

**Commit point:** `feat(workflow): add tier lifecycle reference skill`

### Task 1.2: Register lifecycle skill in canonical enforcement

**Files:**
- `src/core/host-generation/types.ts`
- `scripts/check-canonical-skills.js`

**Context:**
- Read `c3spec/memory/workflow/single-canonical-skill-pipeline.md`.
- Read `c3spec/specs/canonical-skills/spec.md`.

**Steps:**
- Add `c3spec-tier-lifecycle` to `REQUIRED_CANONICAL_SKILL_NAMES`.
- Add `c3spec-tier-lifecycle` to the `REQUIRED` list in `scripts/check-canonical-skills.js`.
- Preserve existing ordering around tier workflow skills: place lifecycle near tier skills, before subagent/host/resume helpers.

**Verification:**
- Run `pnpm check:canonical-skills`.

**Commit point:** combine with Task 1.3 if tests are added in the same pass.

### Task 1.3: Add canonical registration tests

**Files:**
- Likely `test/core/host-generation/canonical.test.ts`
- Potentially `test/core/host-generation/renderers.test.ts` if generated host output assertions depend on the required skill list.

**Context:**
- Read existing tests around `REQUIRED_CANONICAL_SKILL_NAMES`.
- Prefer direct unit tests over CLI subprocess tests to avoid unnecessary `runCLI` overhead.

**Steps:**
- Add/update assertions that `c3spec-tier-lifecycle` is included in the required canonical skill names.
- Add/update fixture expectations if tests compare discovered canonical skill counts.
- Avoid brittle full-list snapshots unless that is the local pattern.

**Verification:**
- Run targeted host-generation/canonical tests.
- Run `pnpm check:canonical-skills`.

**Commit point:** `test(workflow): require tier lifecycle canonical skill`

---

## Stage 2 - Tier Skill Alignment

These tasks touch overlapping skill files and should be implemented sequentially.

### Task 2.1: Update Tier 1 workflow skill

**Files:**
- `.agents/skills/c3spec-tier1-fix/SKILL.md`

**Context:**
- Read `c3spec-tier-lifecycle` after Stage 1.
- Read `c3spec/changes/tier-workflow-resumability/specs/workflow-routing/spec.md`.
- Compare current T1 contradictions: "No change directory" versus writing `c3spec/changes/tier1-...` HTML artifacts.

**Steps:**
- Update description/frontmatter text if needed so it no longer says "No change directory" as the workflow shape.
- Add a step after worktree setup to create `c3spec/changes/tier1-<slug>/tier.md`.
- Add a step to write `mini-plan.md` to the T1 folder before execution.
- Require both HTML and markdown versions for spec impact and micro-retro.
- Update spec impact and micro-retro paths to use the T1 folder.
- Add explicit archive readiness check against `c3spec-tier-lifecycle`.
- Remove "What NOT to do" language that forbids creating a C3Spec change directory; replace with "do not create full proposal/design/tasks/plan ceremony".

**Verification:**
- Search the file for remaining contradictory phrases like `No change directory` or `Do not create a C3Spec change directory`.
- Confirm all T1 required artifacts from lifecycle skill are referenced.

**Commit point:** `docs(workflow): give tier1 fixes a lightweight change record`

### Task 2.2: Update Tier 2 workflow skill

**Files:**
- `.agents/skills/c3spec-tier2-feature/SKILL.md`

**Context:**
- Read lifecycle skill and design D2/D6.
- Current T2 uses `retro.html`; design uses `retrospective.md` and HTML companion language.

**Steps:**
- Add `tier.md` creation early in the T2 workflow.
- Normalize verification artifact to `verify.md` rather than purely inline "5 checks".
- Normalize retrospective markdown to `retrospective.md`, with HTML companion if review is needed.
- Make archive readiness check consult `c3spec-tier-lifecycle` before invoking archive.
- Keep T2 lightweight: do not add full brainstorm or mandatory delta specs when not needed.

**Verification:**
- Confirm T2 required artifacts from lifecycle skill are all referenced.
- Confirm optional `design.md` and delta specs remain conditional.

**Commit point:** `docs(workflow): align tier2 artifacts with lifecycle contract`

### Task 2.3: Update Tier 3 workflow skill

**Files:**
- `.agents/skills/c3spec-tier3-full/SKILL.md`

**Context:**
- Current Tier 3 already has most required artifacts but lacks `tier.md` and lifecycle readiness references.

**Steps:**
- Add `tier.md` creation after `c3spec new change <name>` / change scaffold step.
- Reference `c3spec-tier-lifecycle` before artifact work and before archive.
- Ensure full artifact order remains brainstorm, proposal, design, specs, tasks, plan, implementation, verify, retrospective, memory, archive.
- Keep HTML review gates unchanged.

**Verification:**
- Confirm `tier.md` appears before `brainstorm.md`.
- Confirm archive readiness check appears before `c3spec archive -y`.

**Commit point:** `docs(workflow): add lifecycle metadata to tier3`

### Task 2.4: Update archive helper guidance

**Files:**
- `.agents/skills/c3spec-archive-change/SKILL.md`
- `.agents/skills/c3spec-bulk-archive-change/SKILL.md` if it archives tier changes directly

**Context:**
- Read `c3spec/changes/tier-workflow-resumability/specs/cli-archive/spec.md`.

**Steps:**
- Add a pre-archive readiness step that reads `c3spec-tier-lifecycle`.
- Require checking tier-specific required artifacts when `tier.md` exists.
- Preserve backwards-compatible handling for legacy/pre-fork changes without `tier.md`.
- Report missing required artifacts before invoking `c3spec archive`.

**Verification:**
- Confirm archive helpers reference `c3spec-tier-lifecycle`, `tier.md`, and "legacy/pre-fork" or equivalent backwards-compatible language.

**Commit point:** `docs(workflow): add tier readiness checks before archive`

---

## Stage 3 - Resume / Apply / Host Adapter Realignment

These tasks share conceptual context but mostly touch separate files. They may be implemented in parallel only if separate implementers coordinate through the lifecycle skill and avoid editing the same files.

### Task 3.1: Update continue helper

**Files:**
- `.agents/skills/c3spec-continue-change/SKILL.md`

**Context:**
- Read lifecycle skill, `design.md` D4, and `specs/canonical-skills/spec.md`.
- Current helper references `AskUserQuestion tool`; host-specific structured prompts should go through `c3spec-host-adapter` or current host primitives.

**Steps:**
- Change selection guidance to use host-appropriate structured questions via `c3spec-host-adapter` when available.
- Add tier identification flow: read `tier.md`, infer only with warning when missing.
- Add tier-specific next-action logic for T1/T2/T3.
- Preserve schema-backed `c3spec status` / `c3spec instructions` usage as artifact context, not the full workflow contract.
- Keep "create one artifact per invocation" discipline.

**Verification:**
- Confirm retired "spec-driven schema (proposal → specs → design → tasks)" language is removed or clearly scoped as legacy schema-only context.
- Confirm helper references `c3spec-tier-lifecycle`.

**Commit point:** `docs(workflow): make continue-change tier-aware`

### Task 3.2: Update apply helper

**Files:**
- `.agents/skills/c3spec-apply-change/SKILL.md`

**Context:**
- Read lifecycle skill, `design.md` D5, and `c3spec-subagent-dev/SKILL.md`.

**Steps:**
- Add tier identification via `tier.md` and lifecycle contract.
- Verify required planning artifacts before implementation.
- Keep `c3spec instructions apply --change <name> --json` usage for schema-backed context when available.
- Replace direct "loop through tasks and mark task complete" behavior with a handoff to `c3spec-subagent-dev`.
- State that controller/subagent-dev owns checkbox updates after reviews, not the apply helper.
- Preserve blocked/all-done handling.

**Verification:**
- Search for instructions that tell apply to mark `- [ ]` to `- [x]`; remove or reframe them as subagent-dev/controller behavior.
- Confirm helper references `c3spec-tier-lifecycle` and `c3spec-subagent-dev`.

**Commit point:** `docs(workflow): route apply-change through subagent-dev`

### Task 3.3: Update host adapter

**Files:**
- `.agents/skills/c3spec-host-adapter/SKILL.md`

**Context:**
- Read `specs/canonical-skills/spec.md` host adapter requirement.

**Steps:**
- Update Cursor section to say dispatch by role name through Cursor's available subagent mechanism when roles are exposed directly.
- Avoid requiring `.cursor/agents/<name>.md` files.
- Keep Claude Code and Codex sections accurate unless evidence says otherwise.
- Keep unsupported-host behavior.

**Verification:**
- Confirm file no longer implies Cursor cannot dispatch unless `.cursor/agents/<name>.md` exists.

**Commit point:** `docs(workflow): correct cursor subagent dispatch guidance`

---

## Stage 4 - Tests and Contract Drift Checks

### Task 4.1: Add lifecycle/helper content tests

**Files:**
- Prefer a new focused test such as `test/specs/tier-lifecycle-skill-contract.test.ts`
- Or extend an existing specs/skill validation test if local pattern fits better

**Context:**
- Prefer direct filesystem reads over CLI subprocess calls.
- Use Node `path.join` / `path.resolve` for cross-platform paths.

**Steps:**
- Assert `.agents/skills/c3spec-tier-lifecycle/SKILL.md` exists and has frontmatter name `c3spec-tier-lifecycle`.
- Assert lifecycle skill contains required tier artifact names.
- Assert tier1/tier2/tier3 skills reference `c3spec-tier-lifecycle`.
- Assert continue/apply/archive helper skills reference `c3spec-tier-lifecycle`.
- Assert apply helper references `c3spec-subagent-dev` and no longer instructs direct checkbox mutation outside controller/subagent-dev ownership.
- Assert host adapter Cursor section does not require `.cursor/agents/<name>.md`.

**Verification:**
- Run the new focused test.

**Commit point:** `test(workflow): lock tier lifecycle skill contract`

### Task 4.2: Update existing tests for required canonical skill list

**Files:**
- `test/core/host-generation/canonical.test.ts`
- Other host-generation tests if failures show required count/list assumptions.

**Steps:**
- Update expectations for the new required skill.
- Keep assertions meaningful: required list contains `c3spec-tier-lifecycle`, validation fails when it is absent, and generated/install outputs include it where applicable.

**Verification:**
- Run `pnpm test -- test/core/host-generation/canonical.test.ts`.
- Run `pnpm check:canonical-skills`.

**Commit point:** may combine with Task 1.3 if not already committed.

---

## Stage 5 - Spec Sync, Generation, and Verification

### Task 5.1: Sync approved delta specs into source specs

**Files:**
- `c3spec/specs/workflow-routing/spec.md`
- `c3spec/specs/canonical-skills/spec.md`
- `c3spec/specs/cli-artifact-workflow/spec.md`
- `c3spec/specs/cli-archive/spec.md`

**Steps:**
- Apply delta specs from `c3spec/changes/tier-workflow-resumability/specs/*/spec.md` into source specs.
- Preserve source-spec normalization: `## Purpose`, `## Requirements`, and parseable `### Requirement:` headers.
- Do not leave delta-only headers in source specs.

**Verification:**
- Run source spec normalization tests.
- Run `node bin/c3spec.js validate tier-workflow-resumability`.

**Commit point:** `docs(specs): sync tier workflow lifecycle requirements`

### Task 5.2: Regenerate host artifacts

**Files:**
- Generated host artifacts under `.claude/`, `.cursor/`, `.codex/`, `AGENTS.md`, `CLAUDE.md`, or related generated surfaces as produced by repo commands

**Steps:**
- Identify the repo's canonical sync command from package scripts / docs.
- Run the command that regenerates host artifacts from `.agents/`.
- Review generated diffs to ensure they are expected and sentinel-protected.

**Verification:**
- Run generated artifact drift checks if available.
- Run `pnpm run build`.

**Commit point:** `chore(workflow): regenerate host artifacts for tier lifecycle`

### Task 5.3: Full verification

**Commands:**
- `pnpm check:canonical-skills`
- `pnpm run build`
- `pnpm test`
- Any generated artifact drift command discovered in Stage 5.2
- `node bin/c3spec.js validate tier-workflow-resumability`
- `node bin/c3spec.js status --change tier-workflow-resumability`

**Steps:**
- Capture command outcomes in `verify.md`.
- Confirm `tasks.md` checkboxes are complete.
- Record known residual risks: CLI hard lifecycle enforcement deferred; pre-fork legacy changes not retroactively checked.

**Commit point:** `docs(verify): record tier workflow resumability verification`

---

## Stage 6 - Retrospective, Memory, Archive

### Task 6.1: Retrospective

**Files:**
- `c3spec/changes/tier-workflow-resumability/retrospective.html`
- `c3spec/changes/tier-workflow-resumability/retrospective.md`

**Steps:**
- Write retrospective HTML with evidence, what worked, what did not, workflow/process improvements, and memory recommendation.
- Print the `file://` path and wait for user approval.
- Save markdown version after approval.

**Verification:**
- Confirm both retrospective artifacts exist before archive readiness check.

**Commit point:** `docs(retro): capture tier workflow resumability retrospective`

### Task 6.2: Memory capture

**Files:**
- `c3spec/memory/<category>/<slug>.md`
- `c3spec/memory/MEMORY.md`

**Steps:**
- If retrospective identifies a generalizable learning, create memory entry and index it.
- If no learning generalizes, state that in retrospective and skip memory.

**Commit point:** `docs(memory): add tier lifecycle workflow learning` if applicable.

### Task 6.3: Archive and finish

**Steps:**
- Run archive readiness check per `c3spec-tier-lifecycle`.
- Archive the change with `node bin/c3spec.js archive tier-workflow-resumability -y`.
- Confirm delta specs synced into `c3spec/specs/`.
- Finish branch according to user direction at that time: commit/push/PR or direct main merge.

**Verification:**
- Run final `git status`.
- Confirm active change folder moved to archive.

