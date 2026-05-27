---
name: single-canonical-skill-pipeline
description: c3spec skills live only under .agents/skills/; legacy root skills/ and codegen are retired.
category: workflow
tags: [skills, host-generation, canonical, workflow-gates]
source-change: feat/collapse-legacy-skill-pipeline
date: 2026-05-26
status: active
---

# Single Canonical Skill Pipeline

## Context

IDEAS #8 collapsed the legacy root `skills/` → TypeScript codegen path into `.agents/skills/` only.

## Learning

- Edit skills only under `.agents/skills/<name>/SKILL.md`.
- Register new required skills in `REQUIRED_CANONICAL_SKILL_NAMES` (`src/core/host-generation/types.ts`).
- Slash-command templates remain under `src/core/templates/commands/` for migration/drift detection only — not skill delivery.
- Workspace utility installs copy bundled `.agents/skills/` via `readBundledSkillsForWorkflows()`.
- Do not reintroduce `scripts/generate-templates.js` or root `skills/`.

## Applies When

- Adding or changing agent-facing skills
- Changing init/update/workspace skill install behavior
- Updating CI skill validation

## Supersedes

See `workflow/two-skill-pipelines.md` (historical — dual pipeline retired).
