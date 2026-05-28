# Concepts (pi-only)

c3spec is a spec-driven workflow system designed for pi runtime.

## Core ideas

- Single front door: `/c3spec:start`
- Tiered execution: Research / T1 / T2 / T3
- Canonical skills: `.agents/skills/`
- Durable artifacts: `c3spec/changes/`, `c3spec/specs/`, `c3spec/memory/`

## Runtime model

- pi-only runtime contract
- package lifecycle managed by pi (`pi install`, `pi update`, `pi remove`)
- no multi-host adapter workflow in core
