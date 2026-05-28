# Retrospective — remove-schema-system

## What went well
- Removed schema-facing CLI surface with low regression risk.
- Replaced runtime schema/template directory loading with fixed built-in workflow contracts.
- Kept behavior stable for status/instructions/new-change and maintained green tests.

## What was tricky
- Resolver/instruction-loader had deep schema-era assumptions.
- A few schema-specific tests had to be retired or rewritten to match the new architecture.

## Follow-ups
- Sweep remaining docs/spec wording that still implies user-custom schema workflows.
- Consider renaming internal fields from `schemaName` to `workflow` in a future cleanup pass.
