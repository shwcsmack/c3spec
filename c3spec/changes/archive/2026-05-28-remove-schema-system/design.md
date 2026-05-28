# Design: remove-schema-system

## Decisions
1. Remove schema command surface and schema flags from user workflows.
2. Replace schema-based artifact wiring with fixed workflow behavior.
3. Delete schema bundle directories (`schemas/*`, `c3spec/schemas/superpowers-bridge`).
4. Preserve current workflow outputs where practical, without schema knobs.

## Migration shape
- Remove `src/commands/schema.ts` registration.
- Refactor artifact-workflow commands to stop requiring schema resolution.
- Remove resolver/instruction-loader schema directory dependencies.
- Update tests/specs/docs to non-schema contract.

## Risk controls
- Keep regression tests green via focused refactors.
- Update specs alongside code changes.
