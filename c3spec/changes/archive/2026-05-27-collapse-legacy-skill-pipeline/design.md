# Design: Collapse Legacy Skill Pipeline

## Architecture

```mermaid
flowchart LR
  agentsSkills[".agents/skills/"]
  hostGen[host_generation]
  bundled[npm_package_.agents]
  initUpdate["init / update"]
  workspace[workspace_skills]
  agentsSkills --> hostGen
  bundled --> initUpdate
  agentsSkills --> bundled
  bundled --> workspace
```

## Decisions

1. **Canonical list** — Extend `REQUIRED_CANONICAL_SKILL_NAMES` with six utility skills migrated from root `skills/`.
2. **No skill codegen** — Delete `generate-templates.js` and workflow skill TS; keep command templates under `src/core/templates/commands/`.
3. **Workspace install** — `readBundledSkillsForWorkflows()` copies `.agents/skills/` content instead of generating from TS.
4. **Profiles** — `CORE_WORKFLOWS = [explore, sync, archive]`; tier skills always via host generation.

## Retired skills

`c3spec-propose`, `c3spec-new-change`, `c3spec-ff-change` — superseded by `c3spec-start` and tier skills.

## Resumption helpers kept

`c3spec-continue-change` and `c3spec-apply-change` are migrated and required. They cover the gap where an agent has stopped mid-tier (between artifacts, or before all implementation tasks are done) and needs to resume from disk state — either in the same session or with a fresh context — without rerunning `c3spec-start`.
