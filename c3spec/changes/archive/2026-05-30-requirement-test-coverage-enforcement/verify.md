# Verification

## Commands
- `pnpm vitest run test/commands/coverage.test.ts test/commands/validate.test.ts`
- `pnpm vitest run test/specs/workflow-routing-interview-pacing.test.ts test/specs/finish-branch-endgame-contract.test.ts`
- `pnpm vitest run test/specs/tier-lifecycle-skill-contract.test.ts`
- `pnpm vitest run test/core/list.test.ts test/commands/list.test.ts test/commands/show.test.ts`
- `pnpm build`
- `node bin/c3spec.js coverage --strict`

## Outcome
All targeted checks passed. Coverage strict is fully green across 41 specs / 279 requirements with no unknown refs.
