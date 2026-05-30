---
name: c3spec-apply-change
description: Implement tasks from an C3Spec change by handing implementation to c3spec-subagent-dev. Use when the user wants to start implementing, continue implementation, or work through tasks for a tier change.
license: MIT
compatibility: Requires c3spec CLI, `c3spec-tier-lifecycle`, and `c3spec-subagent-dev`.
metadata:
  author: "c3spec"
  version: "2.0"
  generatedBy: "source"
---

Hand implementation of a C3Spec change to `c3spec-subagent-dev`. Identify the tier from on-disk lifecycle metadata, verify the tier-specific planning artifacts exist, read the right context files, and dispatch — do not loop through tasks or flip `tasks.md` checkboxes from this helper.

**Required reference:** Consult `c3spec-tier-lifecycle` for apply readiness, the per-tier required planning artifacts, status semantics, pause points, and fresh-context resume rules. This skill implements the apply-readiness check from that contract; it does not redefine it.

**Input:** Optionally specify a change name. If omitted, check whether one can be inferred from conversation context. If vague or ambiguous, prompt for selection via the host-appropriate mechanism (see Step 1).

---

## Steps

### 1. Select the change

If a change name is provided, use it. Otherwise:

- Infer from conversation context if the user named a change.
- Auto-select only when exactly one active change exists.
- Otherwise run `c3spec list --json` and use a host-appropriate structured question via `c3spec-host-adapter` when the active host exposes a structured selection primitive. Fall back to a plain numbered prompt and let the user pick by name or number.

Announce: `Using change: <name>` and remind the user how to override (e.g. `/c3spec:apply <other>`).

### 2. Read tier metadata first

Before any CLI call, read `c3spec/changes/<change>/tier.md`.

- **If `tier.md` exists:** treat its `Tier`, `Slug`, `Branch`, `Goal`, `Status`, and `Required Artifacts` checklist as the source of truth for the workflow being applied.
- **If `tier.md` is missing:** fall back to folder/artifact inference per `c3spec-tier-lifecycle` Section 6 (`tier1-` / `tier2-` folder prefix, otherwise treat as T3 or legacy). Surface a clear warning that lifecycle metadata is missing so the user knows the apply decision is best-effort.

Announce the resolved tier and `Status:` before proceeding.

### 3. Gather schema-backed context (when available)

For schema-backed changes only (a change with `.c3spec.yaml` or a `schemaName` returned by status), run:

```bash
c3spec status --change "<name>" --json
c3spec instructions apply --change "<name>" --json
```

Treat the responses as **artifact context**, not as the workflow contract:

- `status` gives `schemaName`, `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext` (planning scope and edit constraints).
- `instructions apply` gives `contextFiles` (artifact id → concrete file paths), progress totals, task list with status, the apply `state`, and a schema-specific instruction string.
- The tier lifecycle contract from `c3spec-tier-lifecycle` and `tier.md` still owns required artifacts, pause points, and readiness. Schema output supplements that contract; it does not replace it.

For non-schema T1 changes (and compact T2 folders without `.c3spec.yaml`), skip both CLI calls and rely on `tier.md` plus disk inspection.

**Workspace guard:** If status JSON reports `actionContext.mode: "workspace-planning"` and `allowedEditRoots` is empty, explain that full workspace apply is not supported in this slice. Treat linked repos and folders as read-only context, ask the user to select an affected area through an explicit implementation workflow, and STOP before dispatching.

### 4. Verify apply readiness against the lifecycle contract

Cross-reference disk state against `c3spec-tier-lifecycle` Section 5 (Apply readiness). A change is apply-ready only when every condition holds:

1. `tier.md` exists and `Status:` is `implementation` or later, OR `tier.md` is absent and the change is a recognized legacy/pre-fork change.
2. Tier-specific planning artifacts required before implementation are present:
   - **T1:** `mini-plan.md`
   - **T2:** `proposal.md`, `tasks.md`, `plan.md` (plus any optional `design.md` / delta specs that the change declares)
   - **T3:** `brainstorm.md`, `proposal.md`, `design.md`, every `specs/<capability>/spec.md` delta listed in the proposal, `tasks.md`, `plan.md`
3. Tier-specific progress shows implementation work remaining:
   - **T1:** at least one `- [ ]` in `mini-plan.md` (or the `tier.md` progress checklist).
   - **T2/T3:** at least one `- [ ]` in `tasks.md`.
4. For schema-backed changes, the `instructions apply` response is not in `state: "blocked"`.

Handle non-ready states explicitly before going further:

- **Missing planning artifact** → report what is missing and route the user to `c3spec-continue-change`. Do not dispatch implementation.
- **`state: "blocked"`** (schema-backed) → show the missing-artifacts list from the CLI response and suggest `c3spec-continue-change`.
- **`state: "all_done"` or all tier progress checkboxes are `- [x]`** → congratulate, summarize, and suggest `c3spec-archive-change`. Do not dispatch.
- **Pause point not yet acknowledged** (e.g. `tasks.md` and `plan.md` just created without user confirmation) → surface the gate per `c3spec-tier-lifecycle` Section 4 and STOP.

Otherwise: proceed to read context files and prepare the handoff.

### 5. Read context files appropriate to the tier

Read every relevant artifact for the resolved tier before dispatching `c3spec-subagent-dev`. Use schema-backed `contextFiles` paths when they are available; otherwise read directly from the change folder.

- **T1:** `tier.md`, `mini-plan.md`, plus any spec-impact or memory context already on disk (e.g. `c3spec/memory/MEMORY.md` entries the mini-plan references).
- **T2:** `tier.md`, `proposal.md`, `tasks.md`, `plan.md`, plus `design.md` and any `specs/<capability>/spec.md` deltas when present.
- **T3:** `tier.md`, `brainstorm.md`, `proposal.md`, `design.md`, every `specs/<capability>/spec.md` delta, `tasks.md`, and `plan.md`.

For schema-backed changes, the `contextFiles` map from `c3spec instructions apply --change "<name>" --json` is authoritative for concrete file paths — use it so the helper does not assume specific file names.

Also read `c3spec/memory/MEMORY.md` so memory entries tagged for the affected files can be forwarded to `c3spec-subagent-dev` (see `c3spec-subagent-dev` "Memory context loading").

### 6. Show current progress

Before handing off, display:

- Resolved tier and `Status:` (and a warning if `tier.md` is missing).
- Schema name when schema-backed; otherwise note "non-schema tier folder".
- Progress: `N/M tasks complete` (from `tasks.md` for T2/T3, from `mini-plan.md` or `tier.md` progress checklist for T1).
- A short remaining-work overview pulled from `plan.md` stages (T2/T3) or `mini-plan.md` (T1).
- Any schema-specific instruction string from `c3spec instructions apply` when available.

### 7. Hand off implementation to `c3spec-subagent-dev`

Before handoff, run `c3spec subagent bootstrap --change <name>`. If bootstrap exits non-zero, stop and surface remediation; do not dispatch subagents.

This helper does **not** loop through tasks itself and does **not** mark `tasks.md` / mini-plan checkboxes. Implementation, stage dispatch, two-stage review (spec compliance → code quality), and checkbox updates are owned by the controller and `c3spec-subagent-dev` after both reviews pass.

Invoke `c3spec-subagent-dev` with everything it needs to start without re-deriving context:

- The change name, resolved tier, and change-folder path.
- The plan file path (`plan.md` for T2/T3; `mini-plan.md` for T1) — `c3spec-subagent-dev` reads stages and tasks from this file.
- The context files read in Step 5 (so the implementer prompts can be seeded with the right artifacts).
- Relevant memory entries identified from `c3spec/memory/MEMORY.md`.
- A reminder that the implementer agent never edits `tasks.md` / mini-plan checkboxes; the controller marks them only after both spec and quality review pass.
- For T1: a reminder that the final whole-implementation review is skipped (per `c3spec-subagent-dev` "Tier-specific behavior").
- For T3: a reminder that the final whole-implementation review runs after all stages complete.

After dispatching, this skill's job is done. Resume helpers (`c3spec-continue-change`) handle the next post-implementation gates (verify, retrospective, archive).

### 8. Report status

Show:

- Selected change, tier, and schema name (or "non-schema").
- Progress before dispatch: `N/M tasks complete`.
- The handoff that just happened (e.g. "Dispatched `c3spec-subagent-dev` for Stage 1 of `plan.md`").
- The next gate the user should expect (e.g. "Subagent-dev will pause for review after Stage 1; rerun `c3spec-apply-change` or `c3spec-continue-change` if implementation is interrupted").

---

## Output During Handoff

```
## Applying: <change-name>

**Tier:** <1|2|3>
**Schema:** <schema-name or "non-schema">
**Status:** <implementation|...>
**Progress:** N/M tasks complete

Handing off to c3spec-subagent-dev:
- Plan: <plan-path>
- Context files: <list>
- Memory entries: <list or "none">

Checkbox updates and review gates are owned by the controller and
c3spec-subagent-dev after spec + quality review pass.
```

## Output On Blocked Apply

```
## Apply Blocked: <change-name>

**Tier:** <1|2|3>
**Status:** <planning|...>

Missing planning artifacts:
- <artifact>
- <artifact>

Run `c3spec-continue-change` to produce the next required artifact, or
revisit the relevant tier skill (`c3spec-tier1-fix` / `c3spec-tier2-feature`
/ `c3spec-tier3-full`).
```

## Output On All Done

```
## All Tasks Complete: <change-name>

**Tier:** <1|2|3>
**Progress:** M/M tasks complete

No remaining implementation work. Suggested next step:
- Run verification and write `verify.md`, or
- If verification and retrospective are already complete, run
  `c3spec-archive-change`.
```

---

## Guardrails

- **Read `tier.md` first.** Schema-backed `c3spec status` / `c3spec instructions apply --json` is artifact context, not the workflow contract.
- **Do not run a new interview/grill-me phase in this helper.** Apply decisions come from lifecycle readiness on disk.
- **Warn loudly when lifecycle metadata is missing** rather than fabricating it; fall back to folder/artifact inference and tell the user the apply decision is best-effort.
- **Verify apply readiness before dispatching.** Missing planning artifacts route to `c3spec-continue-change`; blocked/all-done states surface their own outputs above.
- **Never loop through tasks from this helper.** Implementation belongs to `c3spec-subagent-dev`.
- **Never flip `- [ ]` to `- [x]` from this helper.** Checkbox ownership belongs to the controller / `c3spec-subagent-dev` after both spec and quality reviews pass.
- **Never silently bypass a pause point.** Post-`plan.md` confirmation, HTML review gates, and archive readiness must surface explicitly per `c3spec-tier-lifecycle` Section 4.
- **Use the CLI `contextFiles` paths when available.** Do not hardcode file names for schema-backed changes.
- **Respect the workspace guard.** If `actionContext.mode: "workspace-planning"` with empty `allowedEditRoots`, STOP before dispatching.

## How this skill fits with other skills

- **`c3spec-tier-lifecycle`** — source of truth for apply readiness, required planning artifacts, status semantics, and pause points.
- **`c3spec-subagent-dev`** — receives the handoff from this skill, executes the plan in staged parallel subagents, runs two-stage review per task, and owns `tasks.md` / mini-plan checkbox updates.
- **`c3spec-continue-change`** — receives the routing when planning artifacts are missing or a pause point is unacknowledged.
- **`c3spec-tier1-fix` / `c3spec-tier2-feature` / `c3spec-tier3-full`** — own the artifact-generation steps before this helper is invoked.
- **`c3spec-host-adapter`** — supplies the host-appropriate structured-question primitive used in Step 1 and the named-agent dispatch surface used by `c3spec-subagent-dev`.

## Fluid Workflow Integration

This skill supports the "actions on a change" model:

- **Can be invoked any time** there is at least one unchecked `- [ ]` in the tier's progress source and planning artifacts are in place.
- **Allows artifact updates.** If implementation reveals a design/spec issue, `c3spec-subagent-dev` pauses and surfaces the issue; resume by updating artifacts via `c3spec-continue-change` and re-invoking this skill.
