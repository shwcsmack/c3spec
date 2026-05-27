# Verification: enforce-tier-approval-pauses

## Commands

- `pnpm vitest run test/specs/tier-lifecycle-skill-contract.test.ts` - pass (31 tests)

## Outcomes

- Lifecycle contract updated to define non-pausing `tasks.md`/`plan.md`, non-blocking successful `verify.md`, fast-forward defaults, and natural-language approval interpretation.
- Tier skill consumers and resume helper updated to consume new policy without contradictory local pause rules.
- Workflow instruction docs updated with pause and fast-forward defaults.
- Focused tests updated to enforce the new contract language and consumer alignment.

## Residual Risks

- Changes are currently validated with focused contract tests; broader regression coverage across full workflow suites was not run in this pass.
