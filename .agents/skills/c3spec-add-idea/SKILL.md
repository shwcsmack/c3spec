---
name: c3spec-add-idea
description: Capture a new backlog idea into IDEAS.md without disrupting active workflow context.
---

# C3Spec Add Idea

Capture-only skill for backlog intake. Use this whenever the user says things like "add this idea", "capture this for later", or "put this in IDEAS.md".

## Rules

- Do not switch worktrees.
- Do not modify active change artifacts.
- Keep the current workflow context intact.
- Ask at most one clarifying question when needed.

## Steps

1. Read `IDEAS.md` to match current entry style.
2. Extract from user input:
   - title
   - one-paragraph summary
   - actionable bullets
3. Prefer CLI-backed append. Resolve the executable in this order:

```bash
# 1) If globally available
c3spec ideas add "<title>" --summary "<summary>" --bullet "<item1>" --bullet "<item2>"

# 2) Otherwise from the local project package
npm exec -- c3spec ideas add "<title>" --summary "<summary>" --bullet "<item1>" --bullet "<item2>"
```

If both fail, fall back to editing `IDEAS.md` directly.

4. If summary or bullets are missing, ask one focused question, then continue.
5. Confirm result by reporting the new idea number and title.
6. Suggest optional next step:

```bash
c3spec ideas triage
```

## What NOT to do

- Do not renumber/remove/archive ideas in this skill.
- Do not run c3spec tier workflows.
- Do not convert this into proposal/design work.
