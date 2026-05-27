---
name: c3spec-tier1-fix
description: Execute a Tier 1 Spec-Aware Fix. Use after c3spec-start routes here. Covers bugs, investigations, simple changes. No change directory. Fast worktree → mini plan → subagent execution → spec impact → micro-retro → memory capture.
---

# Tier 1 — Spec-Aware Fix

For bugs, investigations, config tweaks, and simple changes that don't introduce new capabilities or change spec-level contracts.

**Input:** Interview context and alignment from `c3spec-start`. Do not re-interview — carry forward everything.

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

> "This fix will produce commits for: implementation, any spec updates, and a memory entry. Do you want to approve all commits upfront, or confirm each one individually?"

Wait for answer. Remember the preference for this session.

---

## Step 1 — Worktree setup

```bash
# Derive branch name from the fix description (kebab-case, max 40 chars)
BRANCH="fix/<short-description>"

superpowers:using-git-worktrees
```

Fast setup — create the worktree and branch. No full test baseline required. Just confirm the worktree is clean.

---

## Step 2 — Generate mini plan

Do NOT invoke `superpowers:writing-plans`. Generate the plan inline from the interview context.

Mini plan format (3-10 tasks, no inline code):

```markdown
## Bug Fix Plan: <short-description>

**Goal:** [one sentence — what the fix achieves]
**Root hypothesis:** [what you believe is broken and why, based on interview + codebase research]

### Task 1: Write failing test
Reproduce the bug with a test that fails for the right reason.
Test file: [path]
Test name: [descriptive name]

### Task 2: Fix root cause
[which file, which function, what specifically changes]

### Task 3: Verify fix
Run [specific test command]. Confirm test passes. Run full suite.

### Task 4: Spec impact check
[which spec files describe behavior touched by this fix — list them]
```

Keep it tight. The implementer subagent should be able to act on each task without ambiguity. Do not include inline code — the implementer reads the actual files.

---

## Step 3 — Execute via c3spec-subagent-dev

Invoke `c3spec-subagent-dev` skill with:
- **Tier: 1** (skip final whole-implementation code review)
- **Plan:** the mini plan from Step 2
- **Memory context:** already loaded from c3spec-start memory scan

The subagent-dev skill handles: implementer dispatch, spec reviewer, quality reviewer, checkbox discipline, HTML file path rule.

---

## Step 4 — Spec impact report (HTML artifact)

After all tasks complete, generate a spec impact report.

For each spec file identified in the mini plan (and any others discovered during implementation):

1. Read the spec file: `cat c3spec/specs/<capability>/spec.md`
2. Read the implementation diff: `git diff <base-sha> HEAD -- <affected-files>`
3. For each Requirements section in the spec, assess: is the behavior described still accurate?

Generate an HTML report at `c3spec/changes/tier1-<branch-name>/spec-impact.html`:

```html
<!-- Rich HTML: use color-coded table, green/yellow/red per spec section -->
<!-- Green = still accurate | Yellow = may need review | Red = stale/wrong -->
```

**Immediately after writing the file, print:**
```
Spec impact report ready — paste into browser:
  file:///[absolute path to spec-impact.html]
```

Wait for the user to review. Ask: "Any spec sections that need updating?" If yes, update them directly and commit. If no, proceed.

---

## Step 5 — Micro-retrospective (HTML artifact)

Generate a micro-retro at `c3spec/changes/tier1-<branch-name>/micro-retro.html`.

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
- A constraint to add to the implementer prompt template

```html
<!-- Rich HTML: three sections, evidence citations, code snippets with syntax highlighting -->
```

**Immediately after writing the file, print:**
```
Micro-retrospective ready — paste into browser:
  file:///[absolute path to micro-retro.html]
```

Wait for review and approval.

---

## Step 6 — Memory capture

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

After writing the file, **add a line to `c3spec/memory/MEMORY.md`** under the correct category section.

If the learning doesn't generalize (one-off, very specific to this code path), note it in the micro-retro as "one-off — no memory entry" and skip this step.

Commit: `docs(memory): add <slug> learning from <branch-name> fix`

---

## Step 7 — Finish

```bash
superpowers:finishing-a-development-branch
```

This confirms tests are green, opens the PR, cleans up the worktree. PR description should reference the spec impact report findings and the memory entry if one was created.

---

## What NOT to do

- Do not create a C3Spec change directory (`c3spec/changes/<name>/`) — this is Tier 1, no change directory
- Do not invoke `superpowers:writing-plans` — use the inline mini plan
- Do not skip the spec impact report even if the fix seems obviously localized
- Do not skip memory capture if the bug class generalizes
- Do not re-interview the user — carry forward context from c3spec-start
