# Proposal: runCLI in-process invocation for tests

## Why

The current `runCLI` helper spawns a fresh Node subprocess for each CLI call. Command-heavy tests pay process startup overhead repeatedly, which is the primary reason `vitest.config.ts` is pinned to a 30s timeout. This slows local iteration and CI, and it will worsen as we add more CLI and spec-enforcement tests.

## What changes

- Refactor `test/helpers/run-cli.ts` so `runCLI` executes the CLI in-process by default.
- Preserve the existing `RunCLIResult` shape (`exitCode`, `signal`, `stdout`, `stderr`, `timedOut`, `command`) so most tests need no rewrites.
- Add an explicit subprocess mode for the small set of true bin-smoke checks that must validate `dist/cli/index.js` launch behavior.
- Update affected test call sites to opt into subprocess mode only where needed.
- Revisit `vitest.config.ts` timeouts and remove/reduce the global bump once the helper overhead is removed.
- Capture before/after test runtime measurements (full suite + `workspace.test.ts`).

## Scope boundaries

In scope:
- Test helper implementation and its immediate call sites.
- Test config timeout policy directly related to helper overhead.

Out of scope:
- Reworking command implementations themselves.
- Broad test-suite architecture changes unrelated to `runCLI` invocation mode.

## Expected impact

- Faster test execution and lower timeout pressure.
- Better signal when tests are actually slow for functional reasons (not process spawn overhead).
- Maintained coverage for both in-process command behavior and real binary launch behavior.

## Risks and mitigations

- Risk: in-process execution leaks shared process state between invocations.
  - Mitigation: ensure per-invocation setup/teardown of stdout/stderr capture, `process.exit` interception, env overrides, cwd isolation, and any mutable module state.
- Risk: subtle behavior drift versus subprocess mode.
  - Mitigation: keep subprocess fallback and use it for targeted smoke tests; validate representative failure-path cases.
