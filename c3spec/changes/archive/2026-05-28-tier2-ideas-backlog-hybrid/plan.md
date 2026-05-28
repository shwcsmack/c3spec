# Plan: Hybrid backlog management

## Stage 1 — CLI foundation
### Task 1.1: Add ideas parser/renderer and operations
Implement deterministic IDEAS.md parsing/writing with numbered heading handling.

### Task 1.2: Add command handlers
Implement add/remove/complete/renumber/triage/lint command actions.

## Stage 2 — Skill integration
### Task 2.1: Add capture skill
Create `c3spec-add-idea` as capture-only skill with CLI-backed append behavior.

### Task 2.2: Register canonical skill
Update canonical required skill lists and checks.

## Stage 3 — Routing and verification
### Task 3.1: Update start skill note
Add routing note for backlog-capture intent.

### Task 3.2: Add tests and verify
Add command tests, run targeted test suite, and run build.
