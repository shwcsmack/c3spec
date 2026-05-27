# Proposal: Collapse Legacy Skill Pipeline

## Why

Two skill pipelines caused drift between host generation and bundled/workspace installs. IDEAS #8.

## What changes

- `.agents/skills/` is the only skill source of truth (12 canonical skills).
- Removed root `skills/`, codegen script, and workflow TypeScript skill templates.
- Slash-command templates moved to `src/core/templates/commands/` for drift detection only.
- Workspace installs copy bundled canonical `SKILL.md` files by workflow profile.
- Profiles/core workflows now: explore, sync, archive (+ verify, onboard, bulk-archive in custom).

## Impact

- `REQUIRED_CANONICAL_SKILL_NAMES`, init/update host generation, workspace skills, tests, specs.
- `pnpm check:codegen` replaced by `pnpm check:canonical-skills`.
