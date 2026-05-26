---
name: c3spec-tier2-feature
description: Execute a Tier 2 Lightweight Feature. Use after c3spec-start routes here. For contained new capabilities with real design decisions but limited footprint. HTML review on planning artifacts before markdown save.
---

# Tier 2 — Lightweight Feature

For new capabilities with clear scope, limited spec footprint (1-2 capabilities), and design decisions that are real but not deeply uncertain.

**Input:** Interview context and alignment from `c3spec-start`. Do not re-interview.

---

## Pre-flight: commit approval

Before doing anything else, ask:

> "This feature will produce commits for: implementation, archive, and a learning entry. Do you want to approve all commits upfront, or confirm each one individually?"

Wait for answer.

---

## Step 1 — Worktree setup

```bash
BRANCH="feat/<short-description>"
superpowers:using-git-worktrees
```

Standard setup with basic test baseline — confirm the suite is green before starting.

---

## Step 2 — HTML Proposal

Generate a proposal document. Write it to `c3spec/changes/tier2-<name>/proposal.html`.

The HTML version is rich and visual:
- Use a clear header with the change name and date
- "Why" section: problem statement, why now (colored callout box)
- "What Changes" section: before/after table with color-coded rows if applicable
- "New Capabilities" section: bulleted list with capability names in code style
- "Impact" section: affected files/APIs in a table

**Immediately after writing:**
```
Proposal ready — paste into browser to review:
  file:///[absolute path to proposal.html]
```

Wait for the user to review. Accept changes or approval. When approved, save the markdown version:

```bash
# Save markdown to the same change directory
c3spec/changes/tier2-<name>/proposal.md
```

The markdown version strips HTML formatting to clean structured text following the proposal template from `c3spec/schemas/superpowers-bridge/templates/proposal.md`.

---

## Step 3 — HTML Design (if decisions are non-trivial)

If the proposal has significant technical decisions (data model choices, API shape, architectural alternatives), generate a design document.

Write to `c3spec/changes/tier2-<name>/design.html`:
- Decisions section: for each decision, a card with "Chosen:", "Reason:", "Alternatives considered:"
- Risks/Trade-offs: table with risk, mitigation
- Architecture diagram if applicable (SVG inline)
- Open Questions: bulleted list

**Immediately after writing:**
```
Design ready — paste into browser to review:
  file:///[absolute path to design.html]
```

Wait for approval. Save markdown version to `c3spec/changes/tier2-<name>/design.md`.

If the feature has no significant technical decisions (implementation is obvious from the proposal), skip this step.

---

## Step 4 — Tasks

Generate tasks from the proposal and design. Do not use `superpowers:writing-plans` for Tier 2 — derive tasks directly from the design decisions.

Write `c3spec/changes/tier2-<name>/tasks.md`:

```markdown
# Tasks: <feature-name>

- [ ] Task 1: [action] — [file(s)]
- [ ] Task 2: [action] — [file(s)]
...
```

Keep tasks at "what" level — specific enough to act on, not so detailed they include inline code. Aim for 5-15 tasks.

Show the task list to the user: "Here are the tasks I've derived — anything missing or wrong?" Wait for a quick scan and confirmation. This should take 30 seconds, not 5 minutes.

---

## Step 5 — Plan

Generate a moderate plan from the tasks. Write to `c3spec/changes/tier2-<name>/plan.md`.

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

---

## Step 6 — Execute via c3spec-subagent-dev

Invoke `c3spec-subagent-dev` skill with:
- **Tier: 2** (skip final whole-implementation code review)
- **Plan:** `c3spec/changes/tier2-<name>/plan.md`
- **Memory context:** from c3spec-start memory scan

---

## Step 7 — Lightweight verify

After all tasks complete, run these 5 checks inline (no formal verify.md file):

1. **Tests pass** — `pnpm test` (or equivalent)
2. **TypeScript clean** — `pnpm exec tsc --noEmit`
3. **Task completion** — all tasks.md checkboxes are `[x]`
4. **Spec sync** — for each capability in `c3spec/changes/tier2-<name>/specs/` (if any), confirm `c3spec/specs/<capability>/spec.md` is up to date
5. **No routing leak** — `ls docs/superpowers/specs/*.md 2>/dev/null` returns nothing new

Report results as a brief inline summary. If any check fails, fix before proceeding.

---

## Step 8 — Lightweight retrospective (HTML artifact)

Generate a compact retro at `c3spec/changes/tier2-<name>/retro.html`.

Four sections:
1. **Evidence** — commit count, diff size, tasks done, test count
2. **What worked** — 2-3 bullets with evidence citations
3. **What didn't** — 1-2 bullets (if any)
4. **Learning** — one learning worth capturing to memory (or "none that generalizes")

```html
<!-- Rich HTML: two-column layout, evidence in sidebar, analysis in main column -->
```

**Immediately after writing:**
```
Retrospective ready — paste into browser:
  file:///[absolute path to retro.html]
```

Wait for approval.

---

## Step 9 — Memory capture (if applicable)

If Step 8 identified a generalizable learning, create a memory entry (same format as Tier 1 Step 6). Add to `c3spec/memory/MEMORY.md` index.

---

## Step 10 — Archive and finish

```bash
c3spec archive -y
```

Archives the compact change directory (`proposal.md`, `design.md`, `tasks.md`, `plan.md`, `retro.md`) and syncs any delta specs.

```bash
superpowers:finishing-a-development-branch
```

PR is last. PR description should reference the proposal and any memory entries created.
