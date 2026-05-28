# Verification: Hybrid backlog management

## Commands

- `pnpm test test/commands/ideas.test.ts` — pass
- `pnpm build` — pass

## Residual risks

- `ideas triage` uses heuristic scoring and may need tuning over time.
- `c3spec-add-idea` behavior still depends on host adherence to skill instructions.
