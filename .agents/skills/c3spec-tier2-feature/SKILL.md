---
name: c3spec-tier2-feature
description: Execute a Tier 2 Lightweight Feature. Use after c3spec-start routes here. For contained new capabilities with real design decisions but limited footprint. Produces the compact T2 artifact set defined by c3spec-tier-lifecycle with HTML review companions for planning artifacts.
---

# Tier 2 — Lightweight Feature

For new capabilities with clear scope, limited spec footprint (1-2 capabilities), and design decisions that are real but not deeply uncertain.

**Input:** Interview context and alignment from `c3spec-start`. Do not re-interview.

**Lifecycle contract:** This skill follows `c3spec-tier-lifecycle`. Consult that skill for tier folder conventions, required artifacts, pause points, apply readiness, and archive readiness. This skill writes the artifacts; the lifecycle skill defines what is required.

The T2 required artifact set is `tier.md`, `proposal.md`, `tasks.md`, `plan.md`, `verify.md`, and `retrospective.md`. `design.md`, delta specs under `specs/<capability>/spec.md`, and HTML review companions (e.g. `proposal.html`, `design.html`, `retrospective.html`) are optional — produce them only when the feature actually needs them.

---

## Pre-flight: clean source tree

Before worktree setup, verify that the source repo where this tier skill is starting has no tracked uncommitted changes:

```bash
git status --porcelain --untracked-files=no
```

Untracked files do not block the workflow. If the command returns any output, stop and show the user the changed tracked files, then abort and ask the user to commit those changes before rerunning.

Do not continue into worktree setup while tracked changes are present. Do not offer stash/continue or "continue anyway" options in the interactive flow.

---

## Step 1 — Worktree setup

```bash
# Derive a kebab-case slug from the feature description (max ~40 chars)
SLUG="<short-description>"
BRANCH="feat/${SLUG}"

superpowers:using-git-worktrees
```

Standard setup with basic test baseline — confirm the suite is green before starting.

Keep the slug around: it names the tier change folder (`c3spec/changes/tier2-${SLUG}/`) and is referenced throughout the rest of the workflow.

---

## Step 2 — Create tier change folder and `tier.md`

Create the T2 change folder and write the lifecycle metadata anchor before producing any planning artifacts.

```bash
mkdir -p c3spec/changes/tier2-${SLUG}
```

Write `c3spec/changes/tier2-${SLUG}/tier.md` following the `tier.md` shape defined in `c3spec-tier-lifecycle`:

```markdown
# Tier 2: <slug>

- Tier: 2
- Slug: <slug>
- Branch: feat/<slug>
- Goal: <one or two sentences describing the feature and scope>
- Status: planning

## Required Artifacts

- [ ] tier.md
- [ ] proposal.md
- [ ] tasks.md
- [ ] plan.md
- [ ] verify.md
- [ ] retrospective.md

## Affected Specs

- <capability> | none

## Progress

(Task progress for this T2 lives in `tasks.md` after Step 5. The controller / `c3spec-subagent-dev` owns those checkboxes.)
```

`tier.md` itself counts as the first required artifact — mark its checkbox `- [x]` once the file is written. Update `Status` as the workflow progresses (`planning` → `implementation` → `verifying` → `retrospective` → `ready-to-archive`).

If the feature later turns out to need a `design.md` (Step 4) or delta specs under `specs/<capability>/spec.md`, add them to the Required Artifacts checklist at that time. They are optional for T2 and not pre-listed.

---

## Step 3 — Proposal

Generate a proposal document. The durable required artifact is `c3spec/changes/tier2-${SLUG}/proposal.md`.

If an HTML review surface is useful for this feature, write `c3spec/changes/tier2-${SLUG}/proposal.html` first as an optional companion.

The HTML version is rich and visual:
- Use a clear header with the change name and date
- "Why" section: problem statement, why now (colored callout box)
- "What Changes" section: before/after table with color-coded rows if applicable
- "New Capabilities" section: bulleted list with capability names in code style
- "Impact" section: affected files/APIs in a table

**Immediately after writing the optional HTML companion:**

```
Proposal ready — paste into browser to review:
  file:///[absolute path to proposal.html]
```

If an HTML companion was generated, wait for the user to review it and accept changes or approval. Then save the durable markdown record to `c3spec/changes/tier2-${SLUG}/proposal.md`.

The markdown version strips HTML formatting to clean structured text following the proposal template from `c3spec/schemas/superpowers-bridge/templates/proposal.md`.

Tick `- [x] proposal.md` in `tier.md` once the file is written. The `proposal.html` companion is optional under the lifecycle contract — keep it on disk if a future reviewer benefits, otherwise it can be discarded after the markdown is saved.

Show the saved `proposal.md` path (and the optional HTML companion path, if one exists) and wait for user approval before continuing to design, tasks, or implementation planning.

---

## Step 4 — Design (optional)

If the proposal has significant technical decisions (data model choices, API shape, architectural alternatives), generate a design document. If the feature has no significant technical decisions (implementation is obvious from the proposal), skip this step — T2 treats `design.md` as optional under `c3spec-tier-lifecycle`.

When a design is warranted, the durable optional artifact is `c3spec/changes/tier2-${SLUG}/design.md`. If an HTML review surface is useful for the design decisions, write `c3spec/changes/tier2-${SLUG}/design.html` first as an optional companion:
- Decisions section: for each decision, a card with "Chosen:", "Reason:", "Alternatives considered:"
- Risks/Trade-offs: table with risk, mitigation
- Architecture diagram if applicable (SVG inline)
- Open Questions: bulleted list

**Immediately after writing the optional HTML companion:**

```
Design ready — paste into browser to review:
  file:///[absolute path to design.html]
```

If an HTML companion was generated, wait for approval. Save the durable markdown record to `c3spec/changes/tier2-${SLUG}/design.md`.

If you produce `design.md`, add it to the Required Artifacts checklist in `tier.md` and tick the box. If skipping, leave it off the checklist — the lifecycle contract does not require it.

---

## Step 5 — Tasks

Generate tasks from the proposal and design. Do not use `superpowers:writing-plans` for Tier 2 — derive tasks directly from the design decisions.

Write `c3spec/changes/tier2-${SLUG}/tasks.md`:

```markdown
# Tasks: <feature-name>

- [ ] Task 1: [action] — [file(s)]
- [ ] Task 2: [action] — [file(s)]
...
```

Keep tasks at "what" level — specific enough to act on, not so detailed they include inline code. Aim for 5-15 tasks. Use `- [ ]` / `- [x]` checkboxes so the same progress signal works for apply readiness, archive readiness, and fresh-context resume per the lifecycle contract.

Tick `- [x] tasks.md` in `tier.md` once the file is written. Checkboxes inside `tasks.md` are owned by the controller / `c3spec-subagent-dev` after two-stage review — do not flip them yourself outside that flow.
`tasks.md` is non-pausing by default under `c3spec-tier-lifecycle`.

---

## Step 6 — Plan

Generate a moderate plan from the tasks. Write to `c3spec/changes/tier2-${SLUG}/plan.md`.

The plan for Tier 2 is structured with stage declarations for independent tasks:

```markdown
# Plan: <feature-name>

## Stage 1 — Parallel-safe
### Task 1.1: [name]
[what to do, which files, test approach — no inline code]

### Task 1.2: [name]
[what to do, which files, test approach — no inline code]

## Stage 2 — Sequential
### Task 2.1: [name]
[depends on stage 1 outcomes]
```

Depth: enough for a subagent to act without guessing. No inline code snippets.

Tick `- [x] plan.md` in `tier.md` once the file is written.
`plan.md` is non-pausing by default under `c3spec-tier-lifecycle`.

Show the task list and staged plan together: "Here are the tasks and plan I've derived — anything missing or wrong?" Continue unless the user explicitly asks to pause.

---

## Step 7 — Execute via c3spec-subagent-dev

Before invoking implementation, update `tier.md` `Status` to `implementation`. This marks the transition from planning to apply-ready execution per `c3spec-tier-lifecycle`.

Invoke `c3spec-subagent-dev` skill with:
- **Tier: 2** (skip final whole-implementation code review)
- **Plan:** `c3spec/changes/tier2-${SLUG}/plan.md`
- **Memory context:** from c3spec-start memory scan

Consult `c3spec-host-adapter` when dispatching named agents.

When implementation tasks are complete, update `tier.md` `Status` to `verifying`.

If this feature changes spec-level behavior in one or two capabilities, write delta specs at `c3spec/changes/tier2-${SLUG}/specs/<capability>/spec.md` during or after implementation and add them to the Required Artifacts checklist in `tier.md`. Delta specs are optional under the lifecycle contract — only produce them when the feature actually changes a capability's contract.

---

## Step 8 — Verification (`verify.md`)

After all tasks complete, run a lightweight verification pass and capture the outcome in a durable markdown record at `c3spec/changes/tier2-${SLUG}/verify.md`. The lifecycle contract requires `verify.md` for T2 — inline summaries alone are not sufficient.

Run these checks:

1. **Tests pass** — `pnpm test` (or equivalent for this stack)
2. **TypeScript clean** — `pnpm exec tsc --noEmit` (skip if the change does not touch TypeScript)
3. **Task completion** — every checkbox in `tasks.md` is `- [x]`
4. **Spec sync** — for each capability in `c3spec/changes/tier2-${SLUG}/specs/` (if any), confirm `c3spec/specs/<capability>/spec.md` is up to date
5. **No routing leak** — `ls docs/superpowers/specs/*.md 2>/dev/null` returns nothing new

Write `verify.md` with the commands run, their outcomes, any spec sync status, and residual risks. Suggested shape:

```markdown
# Verification: <feature-name>

## Commands

- `pnpm test` — <pass | fail with summary>
- `pnpm exec tsc --noEmit` — <pass | n/a>
- Task completion — <count> / <count> tasks checked
- Spec sync — <synced | n/a>
- Routing leak check — <clean | findings>

## Residual risks

- <risk or "none">
```

Report the same outcomes inline as a brief summary. If any check fails, fix before proceeding; do not write a green `verify.md` over a failed run.

Tick `- [x] verify.md` in `tier.md` once the file is written.

If verification passes, `verify.md` is non-blocking under `c3spec-tier-lifecycle` and the workflow can proceed directly to retrospective. Pause only when verification failed or the user requests fixes.

---

## Step 9 — Retrospective

Generate a compact retro. The lifecycle contract requires the markdown durable name to be `retrospective.md`; the HTML companion is optional.

If human review would benefit from HTML, write optional `c3spec/changes/tier2-${SLUG}/retrospective.html` with four sections:

1. **Evidence** — commit count, diff size, tasks done, test count
2. **What worked** — 2-3 bullets with evidence citations
3. **What didn't** — 1-2 bullets (if any)
4. **Learning** — one learning worth capturing to memory (or "none that generalizes")

**Immediately after writing the optional HTML companion:**

```
Retrospective ready — paste into browser:
  file:///[absolute path to retrospective.html]
```

If an HTML companion was generated, wait for approval. Then save the durable markdown record to `c3spec/changes/tier2-${SLUG}/retrospective.md` covering the same four sections and any memory-capture decision.

Update `tier.md` `Status` to `retrospective` while writing this artifact. Do not set `Status` to `ready-to-archive` yet if memory capture is still pending. Tick `- [x] retrospective.md` in `tier.md` once the markdown is saved.

---

## Step 10 — Memory capture (if applicable)

If Step 9 identified a generalizable learning, create a memory entry (same format as Tier 1 Step 7). Add to `c3spec/memory/MEMORY.md` index and record the memory entry path in `tier.md` and `retrospective.md` so the link survives in the durable record.

If the learning doesn't generalize, note it in `retrospective.md` as "one-off — no memory entry" and skip this step.

After the memory entry is created and indexed, or after `retrospective.md` explicitly records "one-off — no memory entry", update `tier.md` `Status` to `ready-to-archive`.

---

## Step 11 — Archive readiness check

Before invoking archive, run the archive readiness check defined in `c3spec-tier-lifecycle` (Section 6) against this change.

The change is archive-ready only when ALL of the following hold:

- `tier.md` exists and `Status` is `ready-to-archive`.
- Every T2 required artifact is present on disk: `tier.md`, `proposal.md`, `tasks.md`, `plan.md`, `verify.md`, `retrospective.md`.
- Any optional artifact that was actually produced (e.g. `design.md`, delta specs under `specs/<capability>/spec.md`) is also present on disk and listed in the Required Artifacts checklist in `tier.md`.
- Every `tasks.md` checkbox is `- [x]`.
- For delta specs under `specs/<capability>/spec.md`, the user has either synced them into `c3spec/specs/<capability>/spec.md` or explicitly chosen "archive without syncing".
- The required artifact checklist in `tier.md` is fully `- [x]`.

If any required artifact is missing or any checkbox is still `- [ ]`, report the gap and complete it before continuing. Do not silently advance past archive readiness.

---

## Step 12 — Archive and finish

```bash
c3spec archive -y
```

Archives the compact change directory (`tier.md`, `proposal.md`, optional `design.md`, `tasks.md`, `plan.md`, `verify.md`, `retrospective.md`, and any retained HTML companions) and syncs any delta specs.

Only the archive transition should flip `tier.md` `Status` to `archived`.

```bash
superpowers:finishing-a-development-branch
```

PR is last. PR description should reference the proposal and any memory entries created.

---

## What NOT to do

- Do not skip `tier.md` — the lifecycle contract requires it as the resume anchor for every T2 change
- Do not skip `verify.md` — the lifecycle contract treats verification as a durable markdown artifact, not just an inline summary
- Do not name the durable retrospective `retro.md` — the lifecycle contract requires `retrospective.md` as the markdown durable name (the HTML companion may be `retrospective.html` or similar)
- Do not add a full brainstorm step or mandatory delta specs — T2 stays lightweight, and `design.md` plus delta specs remain optional under `c3spec-tier-lifecycle`
- Do not invoke `c3spec archive` before the archive readiness check in Step 11 passes
- Do not flip `tasks.md` checkboxes yourself — checkbox ownership belongs to the controller / `c3spec-subagent-dev` after two-stage review
- Do not re-interview the user — carry forward context from c3spec-start
- Do not batch multiple clarifying questions in one message — ask one at a time if follow-up is needed
- Do not dump numbered question lists during planning approvals
