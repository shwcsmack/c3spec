---
name: c3spec-tier1-fix
description: Execute a Tier 1 Spec-Aware Fix. Use after c3spec-start routes here. Covers bugs, investigations, simple changes. Creates a lightweight tier change folder, mini plan, subagent execution, spec impact, micro-retro, and memory capture per the c3spec-tier-lifecycle contract.
---

# Tier 1 — Spec-Aware Fix

For bugs, investigations, config tweaks, and simple changes that don't introduce new capabilities or change spec-level contracts. T1 is lightweight, but it still produces a durable, resumable change record on disk.

**Input:** Interview context and alignment from `c3spec-start`. Do not re-interview — carry forward everything.

**Lifecycle contract:** This skill follows `c3spec-tier-lifecycle`. Consult that skill for tier folder conventions, required artifacts, pause points, apply readiness, and archive readiness. This skill writes the artifacts; the lifecycle skill defines what is required.

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
# Derive a kebab-case slug from the fix description (max ~40 chars)
SLUG="<short-description>"
BRANCH="fix/${SLUG}"

c3spec-using-git-worktrees
```

Fast setup — create the worktree and branch. No full test baseline required. Just confirm the worktree is clean.

Keep the slug around: it names the tier change folder (`c3spec/changes/tier1-${SLUG}/`) and is referenced throughout the rest of the workflow.

---

## Step 2 — Create tier change folder and `tier.md`

Create the T1 change folder and write the lifecycle metadata anchor.

```bash
mkdir -p c3spec/changes/tier1-${SLUG}
```

Write `c3spec/changes/tier1-${SLUG}/tier.md` following the `tier.md` shape defined in `c3spec-tier-lifecycle`:

```markdown
# Tier 1: <slug>

- Tier: 1
- Slug: <slug>
- Branch: fix/<slug>
- Goal: <one or two sentences describing what the fix achieves>
- Status: planning

## Required Artifacts

- [ ] tier.md
- [ ] mini-plan.md
- [ ] spec-impact.html
- [ ] spec-impact.md
- [ ] micro-retro.html
- [ ] micro-retro.md

## Affected Specs

- <capability> | none

## Progress

(Task checkboxes for this T1 live in `mini-plan.md` after Step 3. Mirror them here only if it helps a fresh agent resume.)
```

`tier.md` itself counts as the first required artifact — mark its checkbox `- [x]` once the file is written. Update `Status` as the workflow progresses (`planning` → `implementation` → `verifying` → `retrospective` → `ready-to-archive`).

---

## Step 3 — Write `mini-plan.md`

Do NOT invoke `superpowers:writing-plans`. Generate the plan inline from the interview context and write it to `c3spec/changes/tier1-${SLUG}/mini-plan.md` before execution.

The mini plan MUST use `- [ ]` / `- [x]` checkboxes so the same progress signal works for apply readiness, archive readiness, and fresh-context resume per the lifecycle contract.

Mini plan format (3-10 tasks, no inline code):

```markdown
# Mini Plan: <short-description>

**Goal:** [one sentence — what the fix achieves]
**Root hypothesis:** [what you believe is broken and why, based on interview + codebase research]

## Tasks

- [ ] Task 1 — Write failing test
  - Reproduce the bug with a test that fails for the right reason.
  - Test file: [path]
  - Test name: [descriptive name]
- [ ] Task 2 — Fix root cause
  - [which file, which function, what specifically changes]
- [ ] Task 3 — Verify fix
  - Run [specific test command]. Confirm test passes. Run full suite.
- [ ] Task 4 — Spec impact check
  - [which spec files describe behavior touched by this fix — list them]
```

Keep it tight. The implementer agent should be able to act on each task without ambiguity. Do not include inline code — the implementer reads the actual files.

Tick the `- [ ] mini-plan.md` checkbox in `tier.md` once the file is written.

---

## Step 4 — Execute via c3spec-subagent-dev

Before invoking implementation, update `tier.md` `Status` to `implementation`. This marks the transition from planning to apply-ready execution per `c3spec-tier-lifecycle`.

Invoke `c3spec-subagent-dev` skill with:
- **Tier: 1** (skip final whole-implementation code review)
- **Plan:** `c3spec/changes/tier1-${SLUG}/mini-plan.md`
- **Memory context:** already loaded from c3spec-start memory scan

The subagent-dev skill handles: implementer dispatch, spec reviewer, quality reviewer, checkbox discipline, HTML file path rule. Checkboxes in `mini-plan.md` are owned by the controller / subagent-dev after review — do not flip them yourself outside that flow.

Consult `c3spec-host-adapter` when dispatching named agents.

When implementation tasks are complete, update `tier.md` `Status` to `verifying`.

---

## Step 5 — Spec impact report (HTML + markdown)

After all mini-plan tasks complete, generate a spec impact report. Both an HTML review surface and a durable markdown record are required by the lifecycle contract.

For each spec file identified in the mini plan (and any others discovered during implementation):

1. Read the spec file: `cat c3spec/specs/<capability>/spec.md`
2. Read the implementation diff: `git diff <base-sha> HEAD -- <affected-files>`
3. For each Requirements section in the spec, assess: is the behavior described still accurate?

Write `c3spec/changes/tier1-${SLUG}/spec-impact.html` as the review surface:

```html
<!-- Rich HTML: use color-coded table, green/yellow/red per spec section -->
<!-- Green = still accurate | Yellow = may need review | Red = stale/wrong -->
```

**Immediately after writing the file, print:**

```
Spec impact report ready — paste into browser:
  file:///[absolute path to spec-impact.html]
```

Wait for the user to review. Ask: "Any spec sections that need updating?" If yes, update those spec files directly and commit. If no, proceed.

After the user has reviewed and any spec edits are committed, save the durable markdown record to `c3spec/changes/tier1-${SLUG}/spec-impact.md`. The markdown version captures the same per-spec assessment table and any follow-up actions, without HTML formatting, so it survives as a diffable artifact even if the HTML file is deleted.

Tick both `- [ ] spec-impact.html` and `- [ ] spec-impact.md` in `tier.md`.

---

## Step 6 — Micro-retrospective (HTML + markdown)

Generate a micro-retro. Both an HTML review surface and a durable markdown record are required by the lifecycle contract.

Write the HTML review surface to `c3spec/changes/tier1-${SLUG}/micro-retro.html`.

Answer these three questions with evidence (cite specific files, commit SHAs, test names):

**1. Why did this bug get introduced?**
Root cause — not the symptom. Was it: missing contract definition, type drift, assumption mismatch, missing test coverage, a spec that was ambiguous, something else?

**2. What class of bug is this?**
Name the pattern. Examples: coordinate-system mismatch, API shape drift, state desync, missing edge case in parsing, transitive dependency assumption. Be specific enough that the same class is recognizable next time.

**3. What would prevent the next one?**
Choose the most actionable option:
- A test pattern that would have caught this
- A spec addition that would have made the contract explicit
- A lint rule or type constraint
- A memory entry (if the learning generalizes beyond this bug)
- A constraint to add to the implementer agent manifest

**Immediately after writing the file, print:**

```
Micro-retrospective ready — paste into browser:
  file:///[absolute path to micro-retro.html]
```

Wait for review and approval.

After approval, save the durable markdown record to `c3spec/changes/tier1-${SLUG}/micro-retro.md` covering the same three questions and any memory-capture decision (entry path or "one-off — no memory entry").

Tick both `- [ ] micro-retro.html` and `- [ ] micro-retro.md` in `tier.md`. Update `tier.md` `Status` to `retrospective` while writing this artifact. Do not set `Status` to `ready-to-archive` yet if memory capture is still pending.

---

## Step 7 — Memory capture

After the user approves the micro-retro, create a memory file if the learning generalizes (i.e. the same class of bug could occur elsewhere in the codebase):

**File path:** `c3spec/memory/<category>/<slug>.md`

Categories:
- `bug-patterns/` — recurring bug class with a recognizable pattern
- `constraints/` — hard-won codebase-specific rules (deps, framework quirks, test setup)
- `workflow/` — process improvements
- `design-decisions/` — only if the fix clarified a design decision worth preserving

**Frontmatter:**

```yaml
---
name: <slug>
description: <one line — searchable summary>
category: <category>
tags: [<relevant keywords>]
source-change: <branch name>
date: <YYYY-MM-DD>
status: active
---
```

After writing the file, **add a line to `c3spec/memory/MEMORY.md`** under the correct category section. Also record the memory entry path in `tier.md` and in `micro-retro.md` so the link survives in the durable record.

If the learning doesn't generalize (one-off, very specific to this code path), note it in the micro-retro as "one-off — no memory entry" and skip this step.

After the memory entry is created and indexed, or after `micro-retro.md` explicitly records "one-off — no memory entry", update `tier.md` `Status` to `ready-to-archive`.

Commit: `docs(memory): add <slug> learning from <branch-name> fix`

---

## Step 8 — Archive readiness check

Before finishing the branch, run the archive readiness check defined in `c3spec-tier-lifecycle` (Section 6) against this change.

The change is archive-ready only when ALL of the following hold:

- `tier.md` exists and `Status` is `ready-to-archive`.
- Every T1 required artifact is present on disk: `tier.md`, `mini-plan.md`, `spec-impact.html`, `spec-impact.md`, `micro-retro.html`, `micro-retro.md`.
- Every checkbox in `mini-plan.md` (and the progress checklist in `tier.md`, if mirrored) is `- [x]`.
- The required artifact checklist in `tier.md` is fully `- [x]`.

If any required artifact is missing or any checkbox is still `- [ ]`, report the gap and complete it before continuing. Do not silently advance past archive readiness.

When all readiness conditions hold, leave `tier.md` `Status` as `ready-to-archive` until the archive or finish-branch step actually archives the change. Only an archive transition should set `Status` to `archived`.

---

## Step 9 — Archive and finish

Run archive first, then automatically finish the branch:

```bash
c3spec archive -y
c3spec-finishing-development-branch
```

This confirms tests are green, opens the PR, cleans up the worktree. PR description should reference the spec impact report findings and the memory entry if one was created.

---

## What NOT to do

- Do not create full proposal/design/tasks/plan ceremony for a T1 fix — the T1 folder is intentionally limited to `tier.md`, `mini-plan.md`, `spec-impact.{html,md}`, and `micro-retro.{html,md}` per `c3spec-tier-lifecycle`
- Do not invoke `superpowers:writing-plans` — use the inline `mini-plan.md`
- Do not skip the spec impact report even if the fix seems obviously localized
- Do not skip the durable markdown versions of `spec-impact` or `micro-retro` — HTML alone is not the lifecycle record
- Do not skip memory capture if the bug class generalizes
- Do not flip `mini-plan.md` checkboxes yourself — checkbox ownership belongs to the controller / `c3spec-subagent-dev` after two-stage review
- Do not re-interview the user — carry forward context from c3spec-start
- Do not batch or compound multiple clarifying questions in one message — ask exactly one at a time if follow-up is needed
- Do not omit the required question-first order (`Question`, then `Why this question now:`, then `Recommendation:`) when asking clarifying interview questions
