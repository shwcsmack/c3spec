---
name: vitest-subprocess-cli-tests
description: Subprocess-based CLI tests need vitest testTimeout/hookTimeout headroom well above the 10s default.
category: constraints
tags: [tests, vitest, subprocess, runCLI, timeouts, ci-stability]
source-change: fix/vitest-subprocess-timeouts
date: 2026-05-27
status: active
---

# Vitest Subprocess CLI Tests Need Generous Timeouts

## Context

`test/helpers/run-cli.ts` exposes `runCLI()` which spawns `dist/cli/index.js` as a real Node subprocess for every CLI invocation. Cold-start of a Node subprocess plus the project's import graph costs ~0.5–1.5s per call. Tests that issue 5–10 `runCLI` calls (especially in `test/commands/workspace.test.ts`, `test/commands/validate.test.ts`, `test/commands/artifact-workflow.test.ts`, `test/cli-e2e/basic.test.ts`) reliably exceed vitest's default 10000ms `testTimeout` under realistic CPU contention.

The failure is load-dependent enough to look flaky rather than structural — it surfaces when `pnpm test` runs the whole suite, hides on faster hardware, and gets worse when the file is run in isolation because vitest piles more parallel workers into a single file. That's a recognition trap: if you only see 3/1389 failures in CI, you might dismiss them as flakes; the underlying timing budget is actually wrong.

## Learning

- The repo's `vitest.config.ts` keeps `testTimeout: 30000` and `hookTimeout: 30000`. Do not lower these without first refactoring `runCLI` to in-process invocation (IDEAS.md #18).
- When adding a new test file that calls `runCLI()`, estimate the budget as `runCLI_calls × 1.5s + 2s buffer`. If a single test exceeds ~15s, split it.
- When CI surfaces "Test timed out in Nms" in `workspace.test.ts` / `validate.test.ts` / `artifact-workflow.test.ts` / `cli-e2e/basic.test.ts`, do not chase phantom flakes — check whether subprocess count × cold-start cost actually fits the timeout.
- `teardownTimeout` (3000ms) is unrelated and stays at the lower value; it covers afterAll cleanup, not test bodies.
- Any new test helper that spawns external processes (Node subprocesses, Docker, remote service mocks) inherits this class of problem. Either reuse `runCLI`'s pattern + budget, or get explicit about per-test timeouts at the call site (`{ timeout: 30000 }` on `it()`).

## Applies When

- Authoring a new test that uses `runCLI()` or any other subprocess-spawning helper
- Adjusting `vitest.config.ts` timeouts
- Triaging timeout failures in the 4 listed files (or any future subprocess-based test file)
- Reviewing IDEAS.md #18 progress (in-process `runCLI` refactor) — landing that lets us drop these timeouts back to vitest defaults
