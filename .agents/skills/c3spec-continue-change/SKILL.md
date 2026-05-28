---
name: c3spec-continue-change
description: Continue working on an C3Spec change by creating the next safe artifact or routing to the next approval gate. Use when the user wants to progress their change, create the next artifact, or resume a paused tier workflow.
license: MIT
compatibility: Requires c3spec CLI and `c3spec-tier-lifecycle`.
metadata:
  author: "c3spec"
  version: "2.0"
  generatedBy: "source"
---

Resume a paused C3Spec change. Read on-disk lifecycle metadata first, decide the next safe action from the tier contract, and either create exactly one artifact or hand off to the appropriate skill / approval gate.

**Required reference:** Consult `c3spec-tier-lifecycle` for the canonical T1/T2/T3 folder conventions, required and optional artifacts, pause points, status transitions, apply readiness, archive readiness, and fresh-context resume rules. This skill implements the fresh-context resume rules from that contract — it does not redefine them.

**Input:** Optionally specify a change name. If omitted, check whether one can be inferred from conversation context. If vague or ambiguous, prompt for selection via the host-appropriate mechanism (see Step 1).

---

## Steps

### 1. Select the change

If a change name is provided, use it. Otherwise:

- Run `c3spec list --json` to get available changes sorted by most recently modified.
- Use a host-appropriate structured question via `c3spec-host-adapter` when the active host exposes a structured selection primitive. If the host does not expose one, fall back to a plain numbered prompt and let the user pick by name or number.
- Present the top 3–4 most recently modified changes as options, showing:
  - Change name
  - Tier (from on-disk `tier.md` when present; otherwise inferred from the `tier1-` / `tier2-` folder prefix or marked as "unknown — legacy/pre-fork")
  - Status (from `tier.md` `Status:` line when present; otherwise schema status such as `0/5 tasks`, `complete`, or `no tasks`)
  - How recently the change was modified
- Mark the most recently modified change as "(Recommended)" only when it is genuinely the safest resumption candidate.

**IMPORTANT:** Never auto-select. Always let the user choose. Never guess between two plausible changes.

### 2. Read tier metadata first

Once a change is selected, read `c3spec/changes/<change>/tier.md` before anything else.

- **If `tier.md` exists:** treat its `Tier`, `Slug`, `Branch`, `Goal`, `Status`, and `Required Artifacts` checklist as the source of truth for what workflow is being resumed and where it is paused.
- **If `tier.md` is missing:** fall back to folder/artifact inference per `c3spec-tier-lifecycle` Section 6 — look at the folder prefix (`tier1-` → T1, `tier2-` → T2, bare slug → likely T3) and at which planning artifacts exist on disk. **Surface a clear warning** that lifecycle metadata is missing so the user knows the resume decision is best-effort, not contract-backed.

Announce the resolved tier, status, and "Using change: `<name>`" before proceeding.

### 3. Gather schema-backed context (when available)

For schema-backed changes only (changes with `.c3spec.yaml` or a `schemaName` in status JSON), run:

```bash
c3spec status --change "<name>" --json
```

Treat the response as **artifact context**, not as the workflow contract:

- `schemaName`, `artifacts[]`, `isComplete`, `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext` describe the schema artifact graph and where files belong.
- The tier lifecycle contract from `c3spec-tier-lifecycle` and `tier.md` still owns required artifacts, pause points, and readiness — schema output supplements it; it does not replace it.

For non-schema T1 changes (and compact T2 folders without `.c3spec.yaml`), skip the CLI status call and rely on `tier.md` plus disk inspection.

### 4. Decide the next safe action

Cross-reference `tier.md` `Status:` and required-artifacts checklist against the on-disk artifact set. The next action is the first row that matches, working top-to-bottom:

#### Tier 1 — `c3spec/changes/tier1-<slug>/`

| Disk state | Next safe action |
| --- | --- |
| `mini-plan.md` missing | Create `mini-plan.md` (3–10 tasks) per `c3spec-tier1-fix`. STOP after one artifact. |
| `mini-plan.md` has unchecked `- [ ]` items and no implementation yet | Hand off to `c3spec-apply-change` / `c3spec-subagent-dev` for execution. Do not loop tasks yourself. |
| Implementation done, `spec-impact.html` missing | Generate `spec-impact.html` per `c3spec-tier1-fix`. Pause for user review. STOP. |
| `spec-impact.html` present, `spec-impact.md` missing | Wait for user review of the HTML, then save the durable `spec-impact.md`. |
| Spec impact done, `micro-retro.html` missing | Generate `micro-retro.html`. Pause for user review. STOP. |
| `micro-retro.html` present, `micro-retro.md` missing | Wait for user review of the HTML, then save `micro-retro.md`. |
| Retro done, memory capture decision pending | Surface the memory question; record outcome in `tier.md` and `micro-retro.md`. |
| All required T1 artifacts present and every progress checkbox is `- [x]` | Run the archive readiness check from `c3spec-tier-lifecycle` Section 6 and route to `c3spec-archive-change`. |

#### Tier 2 — `c3spec/changes/tier2-<slug>/`

| Disk state | Next safe action |
| --- | --- |
| `proposal.md` missing | Create `proposal.md` per `c3spec-tier2-feature`. Pause for user approval before producing implementation artifacts. STOP. |
| Proposal approved, `design.md` deemed required but missing | Create `design.md`. |
| Proposal approved, delta spec required but `specs/<capability>/spec.md` missing | Create exactly one delta spec, named after a capability listed in the proposal. |
| `tasks.md` missing | Create `tasks.md`. |
| `plan.md` missing | Create `plan.md`. `plan.md` is non-pausing by default. |
| `tasks.md` has unchecked `- [ ]` items | Hand off to `c3spec-apply-change` / `c3spec-subagent-dev`. Do not flip checkboxes yourself. |
| All `tasks.md` checkboxes are `- [x]` and `verify.md` missing | Run verification and write `verify.md`. |
| Verification done, `retrospective.md` missing | When verification passed, proceed to retrospective without an extra pause; if verification failed or user requested fixes, pause and resolve first. |
| All required T2 artifacts present and `Status:` is `ready-to-archive` | Run the archive readiness check and route to `c3spec-archive-change`. |

#### Tier 3 — `c3spec/changes/<slug>/`

| Disk state | Next safe action |
| --- | --- |
| `brainstorm.md` missing | Create `brainstorm.md` per `c3spec-tier3-full`. |
| `proposal.md` missing | Create `proposal.md`. Pause for user approval of the HTML review surface if one was used. STOP after one artifact. |
| `design.md` missing | Create `design.md`. Pause after the HTML review surface if used. STOP. |
| Any required `specs/<capability>/spec.md` delta missing | Create exactly one delta spec, named after a capability listed in the proposal. |
| `tasks.md` missing | Create `tasks.md`. |
| `plan.md` missing | Create `plan.md`. `plan.md` is non-pausing by default. |
| `tasks.md` has unchecked `- [ ]` items | Hand off to `c3spec-apply-change` / `c3spec-subagent-dev`. |
| All `tasks.md` checkboxes are `- [x]` and `verify.md` missing | Run verification and write `verify.md`. |
| Verification done, `retrospective.md` missing | When verification passed, proceed to retrospective without an extra pause; if verification failed or user requested fixes, pause and resolve first. |
| All required T3 artifacts present and `Status:` is `ready-to-archive` | Run the archive readiness check and route to `c3spec-archive-change`. |

When multiple rows look plausible, pick the topmost one — the lifecycle contract is ordered from earliest to latest in the workflow. When no row matches because the state is genuinely ambiguous, surface what was found on disk and ask the user one clarifying question rather than guessing.

### 5. Honor pause points

`c3spec-tier-lifecycle` Section 4 lists pause points per tier. This skill SHALL NOT silently advance past them. When the next action is "wait for user review" or "wait for user approval" (HTML review surface, post-proposal approval, archive readiness, etc.), report the gate and STOP without creating the next downstream artifact.

### 6. Create at most one artifact per invocation

If the next action is "create artifact X":

- Read every dependency artifact named by `c3spec-tier-lifecycle` and (for schema-backed changes) by `c3spec instructions <artifact-id> --change "<name>" --json`.
- For schema-backed artifacts, treat the CLI `instructions` response as artifact-level context:
  - `context` and `rules` are constraints for **you**, not content for the file — do NOT copy `<context>`, `<rules>`, or `<project_context>` blocks into the artifact output.
  - `template` is the structure to fill in.
  - `dependencies` and `resolvedOutputPath` describe what to read and where to write. If `resolvedOutputPath` is a glob pattern, resolve it using the schema instruction plus the planning context paths.
- Write the artifact and verify it exists on disk.
- STOP after one artifact. Do not chain into the next artifact, even when the next one looks safe.

### 7. Update lifecycle metadata after a workflow phase completes

If creating the artifact completes a phase (e.g. all required planning artifacts now exist while `tier.md` `Status:` is still `planning`), update `tier.md`:

- Tick the corresponding row in the Required Artifacts checklist.
- Update `Status:` to the next state from `c3spec-tier-lifecycle` Section 3 (`planning → implementation → verifying → retrospective → ready-to-archive → archived`).
- Report the status transition to the user.

This skill never marks `tasks.md` checkboxes itself. Checkbox ownership belongs to the controller / `c3spec-subagent-dev` after two-stage review.

### 8. Report progress

After each invocation, show:

- Selected change and tier (and a warning if `tier.md` is missing).
- Artifact created this invocation (if any), or the approval/implementation/verification/retrospective/archive gate that is currently blocking progress.
- Updated required-artifacts checklist for the tier.
- Suggested next invocation: e.g. "Run this skill again after approving the HTML proposal," "Dispatch `c3spec-apply-change` to start implementation," "Run verification and save `verify.md`," or "Ready to archive — run `c3spec-archive-change`."

---

## Guardrails

- **One artifact per invocation.** Even when the next artifact also looks safe, stop and let the user re-invoke.
- **Read `tier.md` before anything else.** Schema status output supplements lifecycle metadata; it does not replace it.
- **Do not run a new interview/grill-me phase in this helper.** Resume decisions come from on-disk lifecycle artifacts.
- **Never silently bypass a pause point.** HTML review gates, post-proposal approvals, and archive readiness must surface explicitly.
- **Do not mutate `tasks.md` checkboxes.** Implementation flow owns that.
- **Update `tier.md`** when a phase completes (status transitions, required-artifacts checklist).
- **Warn loudly when lifecycle metadata is missing** rather than fabricating it. Fall back to folder/artifact inference and tell the user the resume decision is best-effort.
- **Apply schema-backed `c3spec status` / `c3spec instructions` as artifact context only.** The retired "spec-driven schema (proposal → specs → design → tasks)" sequence is legacy schema-only context — do NOT treat it as the workflow contract for a tier change. Tier lifecycle owns the workflow contract.
- **Refuse to guess** when on-disk state is genuinely ambiguous. Ask one clarifying question instead.

## How this skill fits with other skills

- **`c3spec-tier-lifecycle`** — source of truth for tier folder conventions, required artifacts, pause points, status transitions, apply readiness, and archive readiness.
- **`c3spec-tier1-fix` / `c3spec-tier2-feature` / `c3spec-tier3-full`** — own the artifact-generation steps. When this skill says "create artifact X," it defers to the tier skill's instructions for how to author that artifact.
- **`c3spec-apply-change`** — receives the handoff when tasks/mini-plan items remain unchecked and implementation should start.
- **`c3spec-subagent-dev`** — implements task batches and owns `tasks.md` checkbox updates after two-stage review.
- **`c3spec-archive-change`** — receives the handoff once the archive readiness check passes.
- **`c3spec-host-adapter`** — supplies the host-appropriate structured-question primitive used in Step 1 and the named-agent dispatch surface used by downstream skills.
