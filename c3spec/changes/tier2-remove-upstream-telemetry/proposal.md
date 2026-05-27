## Why

c3spec is a clean fork of upstream OpenSpec and should not carry a telemetry capability, PostHog history, or opt-out UX that implies events may be sent. The current implementation is already a no-op, but live specs, CLI hooks, tests, docs, and one archived PostHog change still describe telemetry as part of the product. This change removes telemetry as a first-class capability instead of preserving a disabled shell.

## What Changes

**CLI startup telemetry lifecycle**
- From: `src/cli/index.ts` imports telemetry hooks and calls notice, track, and shutdown functions around every command.
- To: CLI startup keeps global color handling only; no telemetry import or lifecycle hook remains.
- Reason: c3spec should not imply command execution is tracked.
- Impact: Runtime simplification; no replacement telemetry behavior.

**Telemetry module and tests**
- From: `src/telemetry/` exists as a disabled no-op plus config helpers, with telemetry-specific tests.
- To: The telemetry module and its tests are deleted.
- Reason: A disabled shell still preserves telemetry as a product surface.
- Impact: Capability removal.

**Telemetry specs**
- From: `c3spec/specs/telemetry/spec.md` requires PostHog behavior, and `global-config` requires telemetry state.
- To: The telemetry spec is deleted, and global config no longer mentions telemetry state.
- Reason: Specifications should reflect c3spec behavior, not upstream OpenSpec behavior.
- Impact: Spec removal and one modified capability.

**Historical PostHog archive**
- From: `c3spec/changes/archive/2026-01-09-add-posthog-analytics/` preserves the upstream PostHog change.
- To: The PostHog archive folder is deleted as part of complete excision.
- Reason: The user requested complete excision, including the dedicated archived telemetry change.
- Impact: Historical prune limited to the telemetry-specific archive.

**Docs and related specs**
- From: CLI docs and feedback/global config specs reference telemetry opt-outs and behavior.
- To: Live docs/specs/tests no longer reference telemetry, PostHog, or telemetry opt-out variables.
- Reason: Documentation should not teach users to configure a removed capability.
- Impact: Consistency cleanup.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `telemetry`: removed entirely.
- `global-config`: no longer owns telemetry state.
- `cli-feedback`: no longer references telemetry settings; feedback behavior remains independent of CI/environment state.

## Impact

- `src/cli/index.ts`: remove telemetry import and command tracking/shutdown calls.
- `src/telemetry/`: delete telemetry implementation files.
- `test/telemetry/`: delete telemetry-specific tests.
- `c3spec/specs/telemetry/`: delete telemetry capability spec.
- `c3spec/specs/global-config/spec.md`: remove telemetry config requirements and scenarios.
- `c3spec/specs/cli-feedback/spec.md`: remove telemetry-disabled feedback scenario and keep CI behavior.
- `docs/cli.md`: remove telemetry config examples and environment variables.
- `c3spec/changes/archive/2026-01-09-add-posthog-analytics/`: delete the archived upstream PostHog change.
