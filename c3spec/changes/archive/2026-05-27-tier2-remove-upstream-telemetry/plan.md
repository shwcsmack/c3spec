# Plan: Remove Upstream Telemetry

## Stage 1 — Parallel-safe cleanup

### Task 1.1: Remove CLI telemetry lifecycle wiring

Remove telemetry imports and calls from `src/cli/index.ts`. Keep existing global option handling intact, especially `--no-color` behavior. Verify the command path helper is removed if it becomes unused.

Test approach: run TypeScript checking and CLI-related tests to catch unused symbols or startup regressions.

### Task 1.2: Delete telemetry implementation and tests

Delete `src/telemetry/` and `test/telemetry/`. Confirm no remaining active source or test file imports from `../telemetry/`.

Test approach: run TypeScript checking and the full test suite after dependent cleanup.

### Task 1.3: Remove live telemetry specs

Delete `c3spec/specs/telemetry/`. Update `c3spec/specs/global-config/spec.md` so global config no longer describes telemetry fields, telemetry-driven file creation, or OpenSpec-era config paths where touched. Update `c3spec/specs/cli-feedback/spec.md` so feedback remains environment/CI independent without mentioning telemetry settings.

Test approach: run text search for live spec references to telemetry/PostHog and inspect any remaining matches.

## Stage 2 — Documentation and archive cleanup

### Task 2.1: Clean live documentation

Remove telemetry examples and environment variables from `docs/cli.md`. Keep unrelated config examples and environment variables.

Test approach: search docs for active telemetry/PostHog/opt-out references and inspect remaining matches.

### Task 2.2: Delete dedicated PostHog archive

Delete `c3spec/changes/archive/2026-01-09-add-posthog-analytics/`. Leave other archived changes that only mention telemetry incidentally for the broader pre-fork archive audit.

Test approach: confirm that archive folder no longer exists and that no active change directory depends on it.

## Stage 3 — Verification and task completion

### Task 3.1: Audit remaining references

Search for `telemetry`, `PostHog`, `posthog`, `OPENSPEC_TELEMETRY`, and `DO_NOT_TRACK`. Classify remaining matches as intentional backlog/historical references or remove them if they are active product surfaces.

Test approach: record remaining intentional references before marking cleanup tasks complete.

### Task 3.2: Run validation and update tasks

Run `pnpm test` and `pnpm exec tsc --noEmit`. After implementation and review pass, update `tasks.md` checkboxes to completed.

Test approach: both commands must pass before proceeding to archive/finish.
