---
name: c3spec-tier-lifecycle
description: Reference contract that defines T1/T2/T3 change folder conventions, required and optional artifacts, pause points, apply readiness, archive readiness, and fresh-context resume rules. Consulted by tier, resume, apply, and archive skills — not a user-facing workflow entry point.
---

# C3Spec Tier Lifecycle Contract

This is a **reference skill**, not a workflow entry point. Users do not invoke it directly and `c3spec-start` does not route to it. It is consulted by tier workflow skills, resume helpers, apply helpers, archive helpers, and reviewers so that every tier shares one durable lifecycle contract.

If you arrived here looking to start work, go to `c3spec-start` instead. If you arrived here resuming a change, return to `c3spec-continue-change` or `c3spec-apply-change` after reading this contract.

The contract has six parts:

1. Tier identity and change folder conventions
2. Required and optional artifacts per tier
3. `tier.md` metadata anchor
4. Pause points
5. Apply readiness
6. Archive readiness and fresh-context resume rules

---

## 1. Tier identity and change folder conventions

Every change has exactly one tier. The tier determines the change folder layout, the required artifact set, the pause points, and the readiness checks.

| Tier | Routing trigger | Change folder |
| --- | --- | --- |
| T1 — Spec-Aware Fix | bug fix, investigation, config tweak, copy/typo, non-breaking dep bump | `c3spec/changes/tier1-<slug>/` |
| T2 — Lightweight Feature | contained new capability or extension with clear scope and 1–2 capability footprint | `c3spec/changes/tier2-<slug>/` |
| T3 — Full Workflow | significant design uncertainty, architectural reach, breaking/external contract, cross-system, DB schema, expensive-to-undo | `c3spec/changes/<slug>/` |

`<slug>` is a short kebab-case identifier derived from the change description (max ~40 chars). The folder name encodes the tier for T1 and T2 so a fresh agent can identify the tier from disk even before reading `tier.md`. T3 keeps the bare `<slug>` form to preserve compatibility with the schema-backed CLI artifact workflow.

A change folder MUST contain a `tier.md` (see Section 3). If a folder under `c3spec/changes/` does not contain `tier.md`, treat it as a legacy/pre-fork change and apply backwards-compatible handling (no retroactive lifecycle enforcement).

---

## 2. Required and optional artifacts per tier

### Tier 1 — Spec-Aware Fix

**Folder:** `c3spec/changes/tier1-<slug>/`

**Required artifacts:**

- `tier.md` — lifecycle metadata and resume anchor
- `mini-plan.md` — inline mini plan (3–10 tasks)
- `spec-impact.html` — color-coded spec impact review surface
- `spec-impact.md` — durable markdown record of spec impact findings
- `micro-retro.html` — three-question micro-retrospective review surface
- `micro-retro.md` — durable markdown record of the micro-retrospective

**Optional artifacts:**

- Memory entry reference (path under `c3spec/memory/...`) recorded in `tier.md` and `micro-retro.md` when the learning generalizes

T1 does NOT use `proposal.md`, `design.md`, `specs/*/spec.md`, `tasks.md`, `plan.md`, `verify.md`, or a full `retrospective.md`. Forbidding those keeps T1 lightweight.

### Tier 2 — Lightweight Feature

**Folder:** `c3spec/changes/tier2-<slug>/`

**Required artifacts:**

- `tier.md` — lifecycle metadata and resume anchor
- `proposal.md` — problem, scope, acceptance, non-goals
- `tasks.md` — task list with `- [ ]` / `- [x]` checkboxes owned by controller / `c3spec-subagent-dev`
- `plan.md` — staged plan suitable for subagent execution
- `verify.md` — verification commands run and outcomes
- `retrospective.md` — durable retrospective record

**Optional artifacts:**

- `design.md` — when the feature has non-trivial design decisions
- `specs/<capability>/spec.md` delta specs — when the feature changes spec-level behavior
- HTML companion files (e.g. `proposal.html`, `retrospective.html`) — when an HTML review surface is needed alongside the markdown record

`retrospective.md` is the durable artifact name. Older Tier 2 prose may say `retro.md` or `retro.html`; treat that as legacy shorthand and write/update `retrospective.md` for new tier lifecycle work.

### Tier 3 — Full Workflow

**Folder:** `c3spec/changes/<slug>/`

**Required artifacts:**

- `tier.md` — lifecycle metadata and resume anchor
- `brainstorm.md`
- `proposal.md`
- `design.md`
- `specs/<capability>/spec.md` — one delta spec per affected capability
- `tasks.md`
- `plan.md`
- `verify.md`
- `retrospective.md`

**Optional artifacts:**

- HTML review companions retained alongside markdown (e.g. `proposal.html`, `design.html`, `retrospective.html`) when an HTML review gate was used

---

## 3. `tier.md` metadata anchor

`tier.md` is the human-readable resume anchor. Fresh agents read `tier.md` first to identify the workflow they are resuming without relying on chat history.

Required content at the top of every `tier.md`:

- **Tier:** `1`, `2`, or `3`
- **Slug:** the change slug
- **Branch:** the working branch name
- **Goal:** one or two sentences describing the goal and scope
- **Status:** one of `planning`, `implementation`, `verifying`, `retrospective`, `ready-to-archive`, `archived`
- **Required artifacts checklist:** a markdown checklist listing the tier's required artifacts with `- [ ]` / `- [x]` reflecting on-disk state
- **Affected specs:** zero or more spec capability names (e.g. `workflow-routing`, `canonical-skills`); use `none` when the change has no spec impact (typical for many T1 fixes)
- **Progress checklist:** for T1, list mini-plan tasks here or in `mini-plan.md`; for T2/T3, task progress lives in `tasks.md`

Example skeleton (illustrative — adapt to the actual change):

```markdown
# Tier <N>: <slug>

- Tier: <1|2|3>
- Slug: <slug>
- Branch: <branch>
- Goal: <one or two sentences>
- Status: <planning|implementation|verifying|retrospective|ready-to-archive|archived>

## Required Artifacts

- [ ] <artifact-1>
- [ ] <artifact-2>
- ...

## Affected Specs

- <capability> | none
```

Tier skills write the initial `tier.md` after worktree setup. Resume helpers update the checklist and `Status` as the workflow progresses; the controller is responsible for marking `tasks.md` checkboxes after review (this skill does not change that ownership).

Status transitions:

- `planning` — the tier folder exists and planning/review artifacts are still being produced or awaiting approval.
- `implementation` — tier-specific planning artifacts are complete and approved, and implementation may be handed to `c3spec-apply-change` / `c3spec-subagent-dev`.
- `verifying` — implementation tasks are complete and verification is in progress.
- `retrospective` — verification is complete and retrospective / memory capture is in progress.
- `ready-to-archive` — retrospective and any memory capture decision are complete; archive readiness may be checked.
- `archived` — the change was archived.

The tier skill that completes a phase updates `Status`. If a resume helper finds all planning artifacts complete while `Status` is still `planning`, it may update the status to `implementation` after reporting that transition to the user.

---

## 4. Pause points

Tier workflows pause for human approval at well-known points. Resume helpers MUST treat these as gates and SHALL NOT silently advance past them.

### Tier 1 pauses

- After `spec-impact.html` is generated — wait for user review and any spec edits
- After `micro-retro.html` is generated — wait for user review
- Before memory capture commit when commit approval is per-commit

### Tier 2 pauses

- After `proposal.md` (and any HTML proposal companion) is generated — wait for user approval before producing implementation artifacts
- `tasks.md` and `plan.md` are non-pausing artifacts by default
- `verify.md` is non-blocking when verification passes; pause only when verification fails or changes are requested
- Before archive — wait for the archive readiness check (Section 6)

### Tier 3 pauses

- After each required Tier 3 HTML review surface (`proposal.html`, `design.html`, `retrospective.html`) — wait for user review before saving the markdown durable record
- After markdown-only planning artifacts such as `brainstorm.md` when no HTML companion was generated — wait for user approval if the tier skill says the artifact requires review
- `tasks.md` and `plan.md` are non-pausing artifacts by default
- `verify.md` is non-blocking when verification passes; pause only when verification fails or changes are requested
- Before archive — wait for the archive readiness check (Section 6)

Across all tiers: if commit approval is per-commit, also pause at each commit point named in the plan.

### Fast-forward behavior

When the user requests `fast forward`:

- Skip approval pauses
- Skip HTML generation and use markdown-only artifacts in scope
- Default scope runs through retrospective unless a narrower scope is explicitly requested
- Stop after retrospective is generated so the human can review before archive

### Approval interpretation

Approval gates accept clear natural-language affirmatives. Skills SHOULD treat plain-language confirmations (for example, "approved", "looks good", "ship it", or similar clear acceptance) as approval.

---

## 5. Apply readiness

`c3spec-apply-change` and any other helper that hands implementation to `c3spec-subagent-dev` MUST verify apply readiness before dispatch.

A change is apply-ready when ALL of the following are true:

1. `tier.md` exists and `Status` is `implementation` or later, OR `tier.md` is absent and the change is a recognized legacy/pre-fork change.
2. All tier-specific planning artifacts required before implementation exist:
   - T1: `mini-plan.md`
   - T2: `proposal.md`, `tasks.md`, `plan.md`
   - T3: `brainstorm.md`, `proposal.md`, `design.md`, all `specs/<capability>/spec.md` deltas, `tasks.md`, `plan.md`
3. Tier-specific task progress indicates there is implementation work left:
   - T1: `mini-plan.md` or the `tier.md` progress checklist contains at least one unchecked `- [ ]` item. If every mini-plan/progress item is `- [x]`, the change is `all_done`, not apply-ready.
   - T2/T3: `tasks.md` contains at least one unchecked `- [ ]` task. If every task is `- [x]`, the change is `all_done`, not apply-ready.
4. For schema-backed changes, the change is not in a `blocked` state per `c3spec status --change <name>`.

A change is schema-backed when the change folder contains `.c3spec.yaml` with a `schema:` value, or when `c3spec status --change <name> --json` returns a `schemaName`. Non-schema T1 and compact T2 folders rely on disk inspection plus `tier.md` and skip CLI blocked-state checks.

If any planning artifact is missing, apply helpers SHALL report the missing artifact and route the user to `c3spec-continue-change` rather than dispatching implementation.

Apply helpers MUST hand implementation to `c3spec-subagent-dev`. They MUST NOT loop through tasks themselves or flip `- [ ]` to `- [x]` in `tasks.md`. Checkbox ownership belongs to the controller / `c3spec-subagent-dev` after two-stage review.

---

## 6. Archive readiness and fresh-context resume rules

### Archive readiness

A change is archive-ready when ALL of the following are true:

1. `tier.md` exists and `Status` is `ready-to-archive` (set after retrospective is complete).
2. Every tier-required artifact from Section 2 is present on disk.
3. Task progress is complete:
   - T1: every checkbox in `mini-plan.md` or the `tier.md` progress checklist is `- [x]`.
   - T2/T3: every `tasks.md` checkbox is `- [x]`.
4. For T2/T3 with delta specs: delta specs under `specs/<capability>/spec.md` have either been synced into `c3spec/specs/<capability>/spec.md` or the user explicitly chose "archive without syncing".
5. The required artifact checklist in `tier.md` is fully `- [x]`.

Archive helpers MUST report any missing required artifact, missing tier metadata, or unchecked task as a blocker or explicit warning before running `c3spec archive`. They SHOULD preserve backwards-compatible handling for legacy/pre-fork changes that lack `tier.md`: surface the missing lifecycle metadata as an explicit warning and proceed only after user confirmation.

### Fresh-context resume rules

When an agent resumes work without prior chat context (a new session, a fresh subagent, or a context reset):

1. Identify the change folder from explicit user input, host-side structured selection, or `c3spec list --json`.
2. Read `tier.md` first. Use its `Tier`, `Slug`, `Branch`, `Goal`, `Status`, and required artifacts checklist as the source of truth for what the workflow is and where it is paused.
3. If `tier.md` is missing, fall back to folder/artifact inference (`tier1-` / `tier2-` folder prefix, presence of `brainstorm.md` and `design.md`, etc.) and surface a warning that lifecycle metadata is missing.
4. For schema-backed tiers (detected by `.c3spec.yaml` or `schemaName` in status JSON), supplement disk inspection with `c3spec status --change <name> --json` and `c3spec instructions ... --change <name> --json`. Treat schema output as artifact context, not as a replacement for the lifecycle contract.
5. Decide the next safe action from the checklist:
   - Missing required planning artifact → create exactly one artifact or hand off to the appropriate tier skill
   - Pause point not yet acknowledged → wait for human approval, do not advance
   - Apply-ready → invoke `c3spec-apply-change` / `c3spec-subagent-dev`
   - Implementation complete but no `verify.md` → run verification
   - Verification complete but no retrospective → write retrospective (do not add an extra approval stop when verification succeeded)
   - All required artifacts present and status `ready-to-archive` → archive
6. Create at most one artifact per resume invocation. Do not silently chain through multiple human gates.

---

## How other skills use this

This contract is consulted by the following canonical skills. None of them should redefine the contract; if their prose drifts from this skill, update them rather than forking the contract here.

- **`c3spec-tier1-fix`** — Reads Section 2 (T1 required artifacts) and Section 4 (T1 pauses). Writes `tier.md`, `mini-plan.md`, `spec-impact.{html,md}`, and `micro-retro.{html,md}`. Runs the archive readiness check from Section 6 before finishing the branch.
- **`c3spec-tier2-feature`** — Reads Section 2 (T2 artifacts) and Section 4 (T2 pauses). Writes `tier.md` early, then proposal/tasks/plan/verify/retrospective markdown records. Consults Section 6 archive readiness before invoking `c3spec-archive-change`.
- **`c3spec-tier3-full`** — Reads Section 2 (T3 artifacts) and Section 4 (T3 pauses). Writes `tier.md` after the change scaffold step, then the full artifact sequence. Consults Section 6 archive readiness before `c3spec archive -y`.
- **`c3spec-continue-change`** — Implements the fresh-context resume rules in Section 6. Reads `tier.md`, applies the tier-specific required artifact checklist from Section 2, respects pause points from Section 4, and reports the next safe action.
- **`c3spec-apply-change`** — Implements the apply readiness check in Section 5. Verifies tier-specific planning artifacts exist, then hands implementation to `c3spec-subagent-dev`. Does not touch `tasks.md` checkboxes directly.
- **`c3spec-archive-change`** — Implements the archive readiness check in Section 6. Checks tier-specific required artifacts when `tier.md` exists; falls back to backwards-compatible behavior with an explicit warning when it does not.
- **`c3spec-bulk-archive-change`** — Applies the same archive readiness check from Section 6 to each candidate change before archiving in bulk. Reports per-change readiness and surfaces any missing required artifacts so the user can confirm or skip individual changes.

Reviewers (`spec-reviewer`, `quality-reviewer`) and `c3spec-subagent-dev` also consult this skill when checking whether a change is missing lifecycle artifacts during implementation review.
