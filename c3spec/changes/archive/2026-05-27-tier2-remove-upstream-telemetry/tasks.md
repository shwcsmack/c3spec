# Tasks: Remove Upstream Telemetry

- [x] Task 1: Remove CLI telemetry lifecycle wiring — `src/cli/index.ts`
- [x] Task 2: Delete telemetry implementation and tests — `src/telemetry/`, `test/telemetry/`
- [x] Task 3: Remove live telemetry spec and clean affected specs — `c3spec/specs/telemetry/`, `c3spec/specs/global-config/spec.md`, `c3spec/specs/cli-feedback/spec.md`
- [x] Task 4: Clean live docs and remaining active references — `docs/cli.md`, active source/test/spec files
- [x] Task 5: Delete dedicated archived PostHog change — `c3spec/changes/archive/2026-01-09-add-posthog-analytics/`
- [x] Task 6: Verify no live telemetry/PostHog references remain outside intentional historical or backlog context
- [x] Task 7: Run validation checks and update task checkboxes after review

## Reference Audit Notes

Active product surfaces checked clean for `telemetry`, `PostHog`, `posthog`, `OPENSPEC_TELEMETRY`, `C3SPEC_TELEMETRY`, and `DO_NOT_TRACK`:

- `src/`
- `test/`
- `c3spec/specs/`
- `docs/`
- `package.json`
- `package-lock.json`

Remaining matches are limited to intentional context:

- This change's planning artifacts under `c3spec/changes/tier2-remove-upstream-telemetry/`
- Historical or pre-fork change records outside the deleted dedicated PostHog archive
- Backlog/history files such as `IDEAS.md`, `CHANGELOG.md`, and `README_OLD.md`
