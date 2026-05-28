# Brainstorm — remove-schema-system

## Problem
c3spec currently carries a schema engine (`schemas/*`, `c3spec/schemas/*`, resolver/instruction loader/commands) that supports workflow customization. This project is intentionally opinionated and does not need schema-level extensibility.

## Target
Hard-code workflow behavior in c3spec commands/skills and remove schema selection/resolution/template loading while preserving the current user-facing workflow and artifact lifecycle.

## Scope
- Remove schema command surface and schema options from workflow commands.
- Remove schema resolver/instruction-loader dependencies on schema files.
- Remove `schemas/*` and `c3spec/schemas/superpowers-bridge` assets.
- Keep artifact lifecycle and tier behavior equivalent for users.

## Risks
- Breaking CLI compatibility (`--schema` flags, schema commands)
- Test suite assumptions around schema APIs
- Hidden runtime dependencies on resolver/instruction-loader

## Decision
Proceed with full de-schemafication as a breaking internal simplification while preserving functional workflow outputs.