# Verification: Opinionated git workflow + archive endgame trigger

## Commands

- `rg -n "approve all commits|confirm each one individually|Stash changes and continue" .agents/skills/c3spec-* -g 'SKILL.md'`
  - Pass: legacy prompt strings removed from active Tier/Start/Continue/Lifecycle surfaces.
- `rg -n "per-commit approval" .agents/skills/c3spec-tier-lifecycle/SKILL.md`
  - Pass: only the new opt-in policy wording remains (not a mandatory prompt mode).
- `rg -n "superpowers:finishing-a-development-branch" .agents/skills/c3spec-archive-change/SKILL.md`
  - Pass: archive flow now includes automatic branch-finishing step.

## Residual risks

- This change updates skill policy text only; runtime behavior still depends on agents following skill instructions exactly.
