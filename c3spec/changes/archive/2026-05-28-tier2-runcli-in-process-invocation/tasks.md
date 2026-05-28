# Tasks: runCLI in-process invocation

- [x] Task 1: Audit current CLI entrypoints and identify importable in-process program construction path — `src/cli/**`, `test/helpers/run-cli.ts`
- [x] Task 2: Implement in-process invocation mode in `runCLI` with stdout/stderr capture, cwd/env isolation, and Commander exit handling — `test/helpers/run-cli.ts`
- [x] Task 3: Add explicit subprocess fallback mode for bin smoke tests while preserving `RunCLIResult` compatibility — `test/helpers/run-cli.ts`
- [x] Task 4: Update CLI E2E smoke tests to use subprocess mode only where binary launch coverage is required — `test/cli-e2e/basic.test.ts`
- [x] Task 5: Run and adjust affected command test suites to validate behavior parity under in-process mode — `test/commands/workspace.test.ts`, `test/commands/validate.test.ts`, `test/commands/artifact-workflow.test.ts`
- [x] Task 6: Revisit Vitest timeout settings and remove or reduce the subprocess-overhead bump with updated rationale — `vitest.config.ts`
- [x] Task 7: Measure and record before/after runtime for full suite and workspace tests — command output + `c3spec/changes/tier2-runcli-in-process-invocation/verify.md`
