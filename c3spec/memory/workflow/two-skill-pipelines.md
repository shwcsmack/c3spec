---
name: two-skill-pipelines
description: c3spec has separate pipelines for legacy workflow skills and first-class tier/host skills.
category: workflow
tags: [skills, host-generation, codegen, tier-workflows, workflow-gates]
source-change: feat/tier3-full-skill
date: 2026-05-26
status: active
---

# Two Skill Pipelines

## Context

While adding `c3spec-tier3-full`, the first proposal assumed all skills flowed through the root `skills/` directory and `scripts/generate-templates.js`. Reading the implementation showed that is not true.

## Learning

c3spec currently has two skill pipelines:

- Legacy workflow skills under root `skills/` feed template codegen through `scripts/generate-templates.js` and `src/core/templates/workflows/`.
- First-class tier/host skills live under `.agents/skills/` and are installed through the host-generation pipeline via `REQUIRED_CANONICAL_SKILL_NAMES` in `src/core/host-generation/types.ts`.

## Applies When

- Adding or changing Tier 1, Tier 2, or Tier 3 workflow skills
- Updating first-class host behavior for Cursor, Claude Code, or Codex
- Changing init/update behavior for canonical skills
- Auditing whether the root `skills/` directory should continue to exist

## Guidance

Before wiring a skill into codegen, check whether it is a legacy workflow skill or a first-class host/tier skill. Tier skills should be registered through host generation, not `scripts/generate-templates.js`.

When changing workflow behavior that agents must follow (for example pre-flight gates, routing steps, or tier contracts), update every active surface until the legacy pipeline is retired:

- Canonical first-class skills in `.agents/skills/`
- Legacy root skills in `skills/` when duplicate workflow skills still exist there
- Generated routing instruction source in `src/core/host-generation/renderers/instructions.ts` when `CLAUDE.md` / `AGENTS.md` describe the same step order
- Generated host artifacts after source edits, using the project's sync/update path rather than hand-editing generated copies
