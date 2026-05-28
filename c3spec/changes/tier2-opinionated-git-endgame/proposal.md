# Proposal: Opinionated git workflow + archive endgame trigger

## Why

Tier workflows repeatedly prompt for commit-approval mode and dirty-tree handling, creating friction in every run. Archive and branch-finishing can drift apart when finalization is not triggered automatically.

## What changes

- Remove per-run commit approval interview from tier skills.
- Make dirty tracked trees a hard stop: show changed paths and require commit-before-rerun.
- Keep lifecycle pause semantics opinionated by default (no per-commit pause mode unless explicitly requested).
- Run `superpowers:finishing-a-development-branch` automatically after successful archive.

## Scope

- `.agents/skills/c3spec-start/SKILL.md`
- `.agents/skills/c3spec-tier1-fix/SKILL.md`
- `.agents/skills/c3spec-tier2-feature/SKILL.md`
- `.agents/skills/c3spec-tier3-full/SKILL.md`
- `.agents/skills/c3spec-tier-lifecycle/SKILL.md`
- `.agents/skills/c3spec-continue-change/SKILL.md`
- `.agents/skills/c3spec-archive-change/SKILL.md`
