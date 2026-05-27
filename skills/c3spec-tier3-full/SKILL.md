---
name: c3spec-tier3-full
description: Execute a Tier 3 Full Workflow after c3spec-start routes here. Covers high-complexity changes with brainstorm, proposal, design, specs, tasks, staged plan, subagent implementation, full verification, retrospective, memory capture, archive, and finishing branch.
---

# Tier 3 - Full Workflow

For new capabilities or architectural changes with significant design uncertainty, breaking changes, cross-system integrations, DB/schema changes, or any change where getting the design wrong is expensive to undo.

**Input:** Interview context and alignment from `c3spec-start`. Do not re-interview unless a critical ambiguity blocks planning.

---

## Pre-flight: clean source tree

Before commit approval or worktree setup, verify that the source repo where this tier skill is starting has no tracked uncommitted changes:

```bash
git status --porcelain --untracked-files=no
```

Untracked files do not block the workflow. If the command returns any output, stop and show the user the changed tracked files. Offer exactly these choices:

1. Stash changes and continue
2. Commit changes first
3. Abort so the user can handle it

Do not continue into worktree setup while tracked changes are present unless the user has first stashed or committed them. Do not offer a "continue anyway" option in the interactive flow.

---

## Pre-flight: commit approval

Before doing anything else, ask:

> "This Tier 3 change will produce commits for: planning artifacts, implementation, verification/spec updates, archive, and any memory entries. Do you want to approve all commits upfront, or confirm each one individually?"

Wait for answer. Remember the preference for this change.

---

## Step 1 - Worktree setup

```bash
BRANCH="feat/<short-description>"
superpowers:using-git-worktrees
```

Standard setup with dependency install and baseline verification. Run the project-appropriate test command before planning or implementing. If the baseline fails, report the failure and ask whether to investigate or proceed.

---

## Step 2 - Create the change directory

Create the c3spec change scaffold:

```bash
c3spec new change "<name>"
```

Use the CLI-reported paths for `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`. Do not assume hardcoded repo-local paths when the CLI provides resolved paths.

---

## Step 3 - Brainstorm artifact

Use the brainstorming skill to explore the problem, constraints, options, and trade-offs before writing proposal or design artifacts. Run discovery with one clarifying question per turn — do not override the skill with batched numbered question lists.

Write the approved output to:

```bash
c3spec/changes/<name>/brainstorm.md
```

The brainstorm should capture:

- Problem framing and why it matters now
- Scope and non-goals
- Options considered
- Key risks and unknowns
- Recommended direction

---

## Step 4 - HTML proposal

Generate a proposal document. Write the HTML version first:

```bash
c3spec/changes/<name>/proposal.html
```

The HTML version should include:

- Clear header with change name and date
- "Why" section with problem statement and why now
- "What Changes" section with before/after table when applicable
- "New Capabilities" section
- "Impact" section covering affected specs, skills, commands, APIs, data, and tests

Immediately after writing:

```text
Proposal ready - paste into browser to review:
  file:///[absolute path to proposal.html]
```

Wait for user approval. When approved, save the markdown version:

```bash
c3spec/changes/<name>/proposal.md
```

---

## Step 5 - HTML design

Generate the technical design. Write the HTML version first:

```bash
c3spec/changes/<name>/design.html
```

The design should include:

- Decisions with chosen approach, reason, and alternatives considered
- Architecture diagrams or flow diagrams when helpful
- Data/API/schema/contracts if affected
- Risks, mitigations, and rollout considerations
- Open questions that still need user input before implementation

Immediately after writing:

```text
Design ready - paste into browser to review:
  file:///[absolute path to design.html]
```

Wait for user approval. When approved, save the markdown version:

```bash
c3spec/changes/<name>/design.md
```

---

## Step 6 - Delta specs

For each affected capability, write or update delta specs under:

```bash
c3spec/changes/<name>/specs/<capability>/spec.md
```

Use the existing c3spec requirement/scenario style. Focus on externally visible behavior and stable workflow contracts, not implementation details.

Show the spec summary to the user when the behavior contract is new, breaking, or high risk. Wait for approval before tasks when the spec materially changes user-facing behavior.

---

## Step 7 - Tasks

Generate tasks from the brainstorm, proposal, design, and delta specs:

```bash
c3spec/changes/<name>/tasks.md
```

Tasks should be specific enough for an implementer agent to execute without guessing. Keep them at "what" level; do not include inline implementation code. Include verification, spec sync, retrospective, archive, and memory work as explicit tasks.

Show the task list to the user for a quick scan:

> "Here are the tasks I've derived - anything missing or wrong?"

Wait for confirmation.

---

## Step 8 - Staged implementation plan

Generate a detailed staged plan:

```bash
c3spec/changes/<name>/plan.md
```

The plan must declare stage structure:

```markdown
## Stage 1 - Parallel-safe
### Task 1.1: [name]
[what to do, files, dependencies, test approach - no inline code]

## Stage 2 - Sequential
### Task 2.1: [name]
[what to do after Stage 1]
```

Depth: enough for a subagent to act without guessing. No inline code snippets.

---

## Step 9 - Execute via c3spec-subagent-dev

Invoke `c3spec-subagent-dev` with:

- **Tier:** 3
- **Plan:** `c3spec/changes/<name>/plan.md`
- **Context:** brainstorm, proposal, design, delta specs, tasks, and relevant memory entries
- **Review behavior:** keep the final whole-implementation code review enabled

The subagent-dev skill handles implementer dispatch, spec reviewer, quality reviewer, checkbox discipline, final Tier 3 review, and HTML file path rule.

Consult `c3spec-host-adapter` when dispatching named agents.

---

## Step 10 - Full verification

After all implementation tasks complete, write:

```bash
c3spec/changes/<name>/verify.md
```

Include:

1. Commands run and outcomes
2. Tests added or updated
3. Typecheck/lint/build results
4. Spec sync status
5. Generated artifact drift checks
6. Manual or exploratory checks, if applicable
7. Known residual risks

If any check fails, fix before proceeding.

---

## Step 11 - Retrospective

Generate a retrospective:

```bash
c3spec/changes/<name>/retrospective.html
```

Include:

1. Evidence: commits, diff size, completed tasks, verification results
2. What worked
3. What did not work
4. Workflow/process improvements
5. Generalizable learning worth capturing to memory, or "none that generalizes"

Immediately after writing:

```text
Retrospective ready - paste into browser:
  file:///[absolute path to retrospective.html]
```

Wait for approval. When approved, save:

```bash
c3spec/changes/<name>/retrospective.md
```

---

## Step 12 - Memory capture

If the retrospective identifies a generalizable learning, create a memory entry:

```bash
c3spec/memory/<category>/<slug>.md
```

Then add it to `c3spec/memory/MEMORY.md` under the correct category.

Skip memory capture only when the retrospective explicitly says the learning is one-off and does not generalize.

---

## Step 13 - Archive and finish

Archive the completed change:

```bash
c3spec archive -y
```

Confirm delta specs have been synced into `c3spec/specs/` as expected.

Finish the development branch:

```bash
superpowers:finishing-a-development-branch
```

PR is last. The PR description should reference the proposal, design, verification, retrospective, and memory entries if any were created.

---

## What NOT to do

- Do not skip the brainstorm for Tier 3 work.
- Do not run brainstorm or discovery with numbered question dumps — one question per turn
- Do not proceed past HTML proposal, design, or retrospective artifacts without printing the `file:///` path and waiting for approval.
- Do not implement before proposal, design, specs, tasks, and plan exist.
- Do not write inline code in `plan.md`.
- Do not dispatch implementers without loading relevant `c3spec/memory/` entries.
- Do not let implementer agents mark `tasks.md` checkboxes.
- Do not skip spec reviewer, quality reviewer, or final whole-implementation review.
- Do not archive before full verification passes.
- Do not create docs under `docs/superpowers/specs/` or `docs/superpowers/plans/`.
