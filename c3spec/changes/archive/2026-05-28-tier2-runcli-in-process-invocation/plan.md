# Plan: runCLI in-process invocation

## Stage 1 — Discovery and helper implementation

### Task 1.1: Locate CLI construction seam for in-process execution
Inspect CLI source to find the program-builder/entry function that can be invoked without spawning `dist/cli/index.js`. Confirm how Commander errors and exits are surfaced.

### Task 1.2: Implement in-process `runCLI` mode
Refactor `test/helpers/run-cli.ts` to run commands in-process by default. Capture stdout/stderr via temporary write interception with strict `finally` cleanup. Ensure per-call cwd/env behavior matches existing helper semantics.

### Task 1.3: Preserve result-shape compatibility and timeout semantics
Keep the exported `RunCLIResult` shape stable. Translate Commander exits to expected `exitCode`/`stderr` outcomes and preserve timeout behavior for call sites that pass `timeoutMs`.

## Stage 2 — Fallback path and test wiring

### Task 2.1: Add subprocess fallback mode
Add an explicit invocation mode/option for subprocess execution for true binary-launch smoke checks. Keep helper API simple and backward compatible for existing default call sites.

### Task 2.2: Update E2E smoke tests to opt into subprocess mode where needed
Adjust `test/cli-e2e/basic.test.ts` so only tests asserting actual binary launch/packaging behavior use subprocess mode; keep logic/command-behavior tests on the fast default path where appropriate.

## Stage 3 — Validation, config cleanup, and performance proof

### Task 3.1: Run affected test suites and resolve parity regressions
Run `artifact-workflow`, `workspace`, `validate`, and `cli-e2e` tests. Fix any mismatches caused by shared-process state, env leakage, or stdout/stderr handling differences.

### Task 3.2: Tighten Vitest timeout configuration
Remove or reduce the global timeout inflation in `vitest.config.ts` now that process spawn overhead is reduced. Keep only the minimal timeout policy needed for genuine workload variance.

### Task 3.3: Measure before/after runtime and document in verification
Capture wall-clock runtime for full suite and `workspace.test.ts` before and after. Record concrete numbers and residual risks in `verify.md`.
