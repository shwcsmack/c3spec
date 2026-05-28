# Plan — remove-schema-system

## Stage 1 - Parallel-safe

### Task 1.1: Remove schema CLI surfaces
Drop `schema`, `schemas`, and `templates` command entry points and remove schema flags from primary workflow commands.

### Task 1.2: Align tests with schema-less CLI
Update e2e and artifact-workflow tests to reflect removed schema commands/options.

## Stage 2 - Sequential

### Task 2.1: De-schemafy artifact workflow internals
Replace schema resolver/template dependence with fixed workflow contract logic.

### Task 2.2: Remove schema metadata dependence
Refactor change creation/status/instructions to avoid relying on schema lookup for behavior.

### Task 2.3: Remove schema assets
Delete `schemas/*` and `c3spec/schemas/superpowers-bridge` once runtime no longer depends on them.

### Task 2.4: Final docs/spec updates + verification
Update specs/docs, run full validation, then archive.
