---
name: c3spec-start
description: Single front door for all development work. Interview the user, classify the tier, and route to the correct workflow. Replaces /c3spec:new, /c3spec:ff, and the manual "direct PR vs c3spec" decision.
---

# C3Spec Start — Interview, Route, Execute

The single entry point for all development work in this project. You interview the user until genuinely aligned, then classify the change into a tier and route to the correct workflow.

## Step 0 — Clean source tree gate (before anything else)

Before memory scan, interview, routing, or tier handoff, verify that the source repo where the workflow is starting has no tracked uncommitted changes:

```bash
git status --porcelain --untracked-files=no
```

Untracked files do not block the workflow. If the command returns any output, stop and show the user the changed tracked files, then abort and ask the user to commit those changes before rerunning.

Do not continue into workflow routing while tracked changes are present. Do not offer stash/continue or "continue anyway" options in the interactive flow.

## Step 1 — Memory scan (before asking anything)

Load `c3spec/memory/MEMORY.md` and read the full index. Note all entries. You will surface relevant ones during the interview when the topic connects.

```bash
cat c3spec/memory/MEMORY.md
```

## Step 2 — Relentless interview

Do not follow a script. Ask what you need to ask, in whatever order makes sense, until you are genuinely satisfied that you understand the change well enough to make every key routing and design decision without guessing.

**First: research the codebase.** Explore related files, existing patterns, the relevant spec files in `c3spec/specs/`. This grounds your questions and lets you offer informed hypotheses rather than asking blindly.

**Then interview.** Offer hypotheses and suggested answers — don't just ask open questions. The user should be able to say "yes exactly" or correct you. Surface any relevant memory entries naturally: "we ran into a coordinate system issue in the selection toolbar before — is this related?"

**Interview pacing.** Ask one interview question per message, then wait for the answer before asking the next. You may include grouped findings, hypotheses, or codebase research in the same message, but the user-facing question at the end must be singular — not a numbered list of questions. Tightly coupled clarifications may share one turn when splitting would feel artificial (for example: "soft-block or hard-block — and if soft, what default?"). If the user volunteers answers to questions you have not asked yet, accept that context and advance; do not re-ask. Keep the interview as short as alignment allows; prefer routing once you can classify confidently over maximizing question count.

Things you might need to understand (not a checklist — just a guide for what "aligned" means):
- What the user wants to change and why it matters now
- What's in scope and what isn't
- Whether this is a bug fix, new feature, refactor, investigation, or something else
- The technical direction and key design decisions
- Which parts of the codebase are affected
- What "done" looks like (acceptance criteria)
- Any risks, unknowns, or past issues in this area

Keep going until you'd be comfortable routing and planning without guessing. One or two questions is rarely enough for anything non-trivial.

## Step 3 — Routing classification

After the interview converges, classify the change. Present your classification explicitly with reasoning before doing anything else.

### Tier 1 — Spec-Aware Fix
**Routes here when:**
- Bug fix restoring intended behavior (no new capability)
- Investigation or debugging session
- Config value tweak with no contract change
- Typo, copy change, minor UI text
- Non-breaking dependency upgrade

**Signal:** Low risk, localized footprint, no new external contracts, no spec-level behavior change.

**What you say:** "This looks like a **Tier 1 Spec-Aware Fix**. I'll fix it directly, then check which spec files were touched and whether any need updating, and run a quick micro-retrospective. No change directory needed. Does that sound right?"

### Tier 2 — Lightweight Feature
**Routes here when:**
- New capability with clear scope and no major design forks
- UI change introducing new user-facing behavior
- Extension of an existing capability where the design decisions are non-trivial but the footprint is contained

**Signal:** Scope is locked, design decisions are real but limited, spec-level changes affect 1-2 capabilities.

**What you say:** "This looks like a **Tier 2 Lightweight Feature**. I'll create a compact change directory with a proposal and design (HTML for review, then markdown), auto-generate tasks, and implement. No full artifact ceremony. Does that work?"

### Tier 3 — Full Workflow
**Routes here when:**
- New capability with significant design decisions or unknown territory
- Architecture change or refactor touching multiple capabilities
- Breaking change or external contract change
- Cross-system integration
- DB schema change
- Anything where getting the design wrong is expensive to undo

**Signal:** High complexity, significant unknowns, multiple spec files affected, risk of spec drift across capabilities.

**What you say:** "This looks like a **Tier 3 Full Workflow**. I'll run the full superpowers-bridge process — brainstorm, proposal, design, specs, tasks, plan — with HTML review at each planning artifact before saving to markdown. Does that match what you expected?"

### Ambiguous cases
When the change could go either way, lean toward the lighter tier and say so explicitly: "I'm routing this to Tier 2 rather than Tier 3 — the scope feels contained enough. If you disagree, say so and I'll move it up."

**Wait for explicit user confirmation before proceeding.** A nod or "yes" is enough. If the user overrides your routing, accept it without debate.

## Step 4 — Route to tier skill

After confirmation:

**Tier 1:** Invoke `c3spec-tier1-fix` skill
**Tier 2:** Invoke `c3spec-tier2-feature` skill
**Tier 3:** Invoke `c3spec-tier3-full` skill

Carry forward everything from the interview as context into the tier skill — the user should not repeat themselves.

## What NOT to do

- Do not dump multiple numbered interview questions in one message
- Do not select a tier or begin tier work before explicit user confirmation
