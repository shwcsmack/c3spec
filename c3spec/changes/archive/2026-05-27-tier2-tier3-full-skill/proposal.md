# Proposal: Tier 3 Full Workflow Skill

## Summary

Add a first-class `c3spec-tier3-full` skill so full c3spec changes follow explicit, repeatable instructions instead of being assembled ad hoc from scattered skill references.

## Why

Tier 1 and Tier 2 already have dedicated skill files that spell out pre-flight, planning, implementation, verification, retrospective, and finishing steps. Tier 3 is currently only described inline in `c3spec-start`, where Step 4 tells the agent to begin the full superpowers-bridge flow and choose the relevant skills.

Tier 3 is the most expensive workflow to get wrong, but it has the least explicit routing surface. That makes agent behavior depend on session memory, host quirks, and whichever related skills the agent happens to read.

## What Changes

- Add `c3spec-tier3-full` as the dedicated Tier 3 workflow skill.
- Update `c3spec-start` so Tier 3 routes to `c3spec-tier3-full` by name instead of describing the flow inline.
- Define the Tier 3 sequence end to end: brainstorm, proposal, design, specs, tasks, plan, apply, verify, retro, archive, and finish.
- Define HTML review checkpoints for planning artifacts before markdown save.
- Register the new Tier 3 skill in the existing host-generation skill list so init/update installs it for supported hosts.

## New Capabilities

- `c3spec-tier3-full` documents the canonical full workflow end to end.
- Tier 3 planning artifacts get explicit HTML review checkpoints before markdown save.
- Implementation handoff to `c3spec-subagent-dev` is defined with Tier 3 final review behavior.
- Archive, retrospective, verification, and memory capture are described as required completion steps.

## Impact

- Skill source: `skills/c3spec-tier3-full/SKILL.md`
- Canonical agent skills: `.agents/skills/c3spec-tier3-full/SKILL.md`, `.agents/skills/c3spec-start/SKILL.md`
- Host generation: `src/core/host-generation/types.ts`, `src/core/host-generation/renderers/instructions.ts`
- Tests: `test/core/init.test.ts`, `test/core/update.test.ts`, and related skill template tests
- Specs: update `c3spec/specs/skill-template-codegen/spec.md` or a workflow-routing spec only if implementation changes observable behavior beyond bundled skill coverage

## Acceptance Criteria

- There is a dedicated `c3spec-tier3-full` skill with pre-flight, planning, apply, verify, retro, archive, finish, and anti-pattern sections.
- `c3spec-start` no longer asks the agent to improvise the Tier 3 flow inline.
- Host-generation skill lists and routing instructions include `c3spec-tier3-full`.
- Tests cover the new skill being installed or updated through the existing host generation path.
- `pnpm test` and TypeScript verification pass.
