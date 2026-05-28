# Verification: runCLI in-process invocation

## Commands

- `pnpm test test/commands/validate.test.ts` — pass (6/6)
- `pnpm test test/commands/artifact-workflow.test.ts test/commands/workspace.test.ts test/cli-e2e/basic.test.ts` — pass (110/110)
- `pnpm exec tsc --noEmit` — pass
- `pnpm test` — pass (79 files, 1421 tests)
- Task completion — 7 / 7 tasks checked
- Spec sync — n/a (no spec behavior changes)
- Routing leak check (`ls docs/superpowers/specs/*.md 2>/dev/null`) — clean

## Runtime measurements

Workspace suite (`test/commands/workspace.test.ts`):
- Before (forced subprocess mode): `real 40.01s`
- After (in-process default): `real 3.80s`

Full test suite (`pnpm test`):
- Before (forced subprocess mode): `real 48.96s`
- After (in-process default): `real 19.53s`

## Residual risks

- In-process mode now captures `console.*` and stdio writes; if future commands write directly to file descriptors in unusual ways, helper capture may need extension.
- Timeout behavior in in-process mode is elapsed-time reporting (cannot hard-kill execution like subprocess mode).
