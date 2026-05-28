# Retrospective: Hybrid backlog management

## Evidence

- Added one new CLI command group and one new canonical skill.
- Added focused tests for add/remove/lint behavior.
- Verified via targeted test and full build.

## What worked

- Hybrid split (skill capture + CLI authority) kept responsibilities clear.
- Small focused test file validated core behavior quickly.

## What didn’t

- Triage scoring is intentionally simple and not yet calibrated to project priorities.

## Learning

- Capture intent should stay lightweight in skills; deterministic maintenance belongs in CLI.
- one-off — no memory entry
