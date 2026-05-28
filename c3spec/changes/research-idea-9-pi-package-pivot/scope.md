# Scope

## In scope

- Map current c3spec host assumptions to pi primitives:
  - Host set is explicitly `cursor|claude|codex` (`src/core/host-generation/types.ts`)
  - Host-specific rendering and generated artifacts (`src/core/host-generation/renderers/*`)
  - Host routing language in generated instructions (`src/core/host-generation/renderers/instructions.ts`)
  - Runtime dispatch contract in `c3spec-host-adapter`
- Assess pi package mechanics (`docs/packages.md`) and resource loading model (`README.md`, `docs/skills.md`, `docs/extensions.md`)
- Evaluate a pi-only migration and tradeoffs for maintenance, ecosystem lock-in, and contributor workflow

## Out of scope

- Implementing code changes
- Publishing an npm package in this pass
- Preserving explicit compatibility for non-pi hosts

## Constraints

- Research-only workflow (no implementation)
- Recommendation must include success criteria, blockers, and phased next steps

## Evidence sources

- c3spec source: `src/core/host-generation/*`, `.agents/skills/c3spec-host-adapter/SKILL.md`, `package.json`
- pi docs:
  - `/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/docs/packages.md`
  - `/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/docs/skills.md`
  - `/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md`
  - `/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/docs/sdk.md`
  - `/usr/local/lib/node_modules/@earendil-works/pi-coding-agent/README.md`
