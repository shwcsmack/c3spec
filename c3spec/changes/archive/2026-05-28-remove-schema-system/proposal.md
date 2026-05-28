# Proposal: remove-schema-system

## Why
The schema system introduces workflow customization complexity that conflicts with c3spec's opinionated model.

## What Changes
- Hard-code the workflow contract in c3spec commands/skills.
- Remove schema selection, schema resolution, and template loading paths.
- Remove schema bundles including `schemas/*` and `c3spec/schemas/superpowers-bridge`.

## Impact
- Affected commands: schema and artifact workflow surfaces
- Affected internals: artifact-graph resolver/instruction-loader assumptions
- Affected specs/tests: workflow-routing and artifact-workflow behavior
