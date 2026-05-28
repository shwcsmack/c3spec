# Retrospective: runCLI in-process invocation

## Evidence

- Implementation files changed: `src/cli/index.ts`, `src/cli/program.ts`, `test/helpers/run-cli.ts`, `test/cli-e2e/basic.test.ts`, `vitest.config.ts`
- Tasks completed: 7/7
- Verification: `pnpm test` (79 files, 1421 tests) + `pnpm exec tsc --noEmit` pass
- Performance delta:
  - `workspace.test.ts`: 40.01s → 3.80s (real)
  - full suite: 48.96s → 19.53s (real)

## What worked

- Splitting CLI setup into `createProgram()` enabled safe in-process invocation without changing command behavior.
- Preserving `RunCLIResult` avoided broad call-site rewrites.
- Keeping targeted subprocess mode for smoke tests maintained binary-launch confidence while removing most overhead.

## What didn't

- Initial in-process capture missed `console.*` paths, producing empty outputs; needed a second pass to intercept both stdio writes and console methods.

## Learning

- For Node CLI test harnesses, introducing a reusable program-construction seam (`createProgram`) is a high-leverage pattern: it dramatically reduces test runtime while preserving subprocess coverage where it actually matters.
