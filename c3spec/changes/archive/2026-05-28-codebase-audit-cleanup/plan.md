# Plan — codebase-audit-cleanup

## Stage 1 - Parallel-safe discovery

### Task 1.1: Surface inventory extraction
Enumerate top-level and subsystem files/directories across runtime, schemas, docs, scripts, config, and packaging. Record candidate cleanup surfaces.

### Task 1.2: Reference tracing
For each candidate, trace references via source/tests/config/docs/package entry points to identify active consumers.

### Task 1.3: Dependency and script audit
Map direct dependencies/devDependencies to actual usage in source/build/test scripts and classify likely removable items.

## Stage 2 - Sequential classification artifacts

### Task 2.1: Build cleanup matrix
Create `c3spec/changes/codebase-audit-cleanup/cleanup-audit.md` with candidate path, evidence, owner surface, risk band, and recommendation.

### Task 2.2: Approval checkpoint on classification
Present matrix summary, especially Band C candidates, for user confirmation before removals.

## Stage 3 - Sequential implementation

### Task 3.1: Apply Band A removals
Delete safe candidates, update docs/config references, and run targeted checks.

### Task 3.2: Apply Band B removals
Execute low-to-medium risk removals with per-item validation and rollback-ready sequencing.

### Task 3.3: Band C gate
Do not remove any Band C candidate without explicit user approval for that item.

## Stage 4 - Verification and closeout

### Task 4.1: Full verification
Run full tests and relevant CLI checks; record outcomes in `verify.md`.

### Task 4.2: Spec and artifact reconciliation
Update/sync affected specs if needed and ensure change artifacts match implemented decisions.

### Task 4.3: Retrospective and memory
Write retrospective, capture reusable learning to memory when applicable, then prepare for archive.
