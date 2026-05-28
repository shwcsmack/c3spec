# Plan

## Stage 1 - Parallel-safe audit
### Task 1.1: Inventory root and archive sets
Collect current folder lists and counts for `c3spec/changes/` and `c3spec/changes/archive/`.

### Task 1.2: Determine deletion set
Build deterministic candidate set matching approved retention policy.

## Stage 2 - Sequential execution
### Task 2.1: Execute hard deletion
Delete classified pre-fork archive folders.

### Task 2.2: Validate retained sets
Ensure c3spec-era archives and active roots remain.

### Task 2.3: Clean stale references
Update/remove stale history guidance that references deleted upstream entries.

## Stage 3 - Verification and closeout
### Task 3.1: CLI and test verification
Run key CLI checks and targeted test commands.

### Task 3.2: Write verify + retrospective artifacts
Capture evidence, residual risks, and memory decision.
