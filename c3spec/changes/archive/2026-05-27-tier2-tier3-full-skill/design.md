# Design: Tier 3 Full Workflow Skill

## Overview

Add `c3spec-tier3-full` as the explicit Tier 3 workflow skill. This change does not add new CLI behavior; it makes the existing full workflow contract first-class, reviewable, and routable from `c3spec-start`.

Tier 3 remains the full c3spec workflow:

1. Pre-flight
2. Brainstorm
3. Proposal
4. Design
5. Specs
6. Tasks and plan
7. Apply
8. Verify, retro, memory, archive, finish

## Decision 1: Author the Skill in Both Existing Skill Surfaces

**Chosen:** Add `skills/c3spec-tier3-full/SKILL.md` for the bundled CLI fallback and `.agents/skills/c3spec-tier3-full/SKILL.md` for first-class agent hosts.

**Reason:** The repo currently has two skill surfaces with different jobs. The root `skills/` directory feeds TypeScript template codegen. The `.agents/skills/` directory is the canonical source for host-rendered agent artifacts used by Cursor, Claude Code, and Codex.

**Note:** Per idea #3 (codebase audit, Sprint 2), the continued existence of the root `skills/` directory will be reassessed. Until then, parity is maintained so the bundled CLI fallback stays consistent with the canonical host-facing skill set.

**Alternatives considered:**

- Only add `.agents/skills/`: host agents would improve, but bundled CLI fallback generation would not know about the skill.
- Only add `skills/`: generated fallback content would exist, but first-class host workflows would still lack the Tier 3 route.
- Refactor to one source of truth first: desirable long term, too broad for this contained workflow fix.

## Decision 2: Register Tier 3 in Host Generation Instead of Template Codegen

**Chosen:** Add `c3spec-tier3-full` to `REQUIRED_CANONICAL_SKILL_NAMES` in `src/core/host-generation/types.ts` and update the injected routing guidance in `src/core/host-generation/renderers/instructions.ts`.

**Reason:** Tier skills are installed through the first-class host-generation pipeline, not the legacy workflow template codegen path. Existing Tier 1 and Tier 2 skills are enumerated by `REQUIRED_CANONICAL_SKILL_NAMES`, and init/update tests mirror that canonical list. Tier 3 should follow that established path.

**Alternatives considered:**

- Add Tier 3 to `scripts/generate-templates.js`: wrong pipeline for tier skills; that script covers legacy workflow templates such as apply, archive, propose, and verify.
- Hand-maintain only test constants: would make tests pass locally while missing the actual host-generation source of truth.

## Decision 3: Route by Skill Name from `c3spec-start`

**Chosen:** Replace the inline Tier 3 handoff sentence in `c3spec-start` with an explicit instruction to invoke `c3spec-tier3-full`.

**Reason:** The purpose of this change is to stop improvisation at the route boundary. The start skill should classify and confirm; the Tier 3 skill should own Tier 3 execution details.

**Alternatives considered:**

- Keep a summarized Tier 3 flow in `c3spec-start`: useful context, but risks becoming a second copy that drifts.
- Route through `c3spec-propose`: skips Tier 3-specific pre-flight, HTML checkpoint, verify, retro, and archive discipline.

## Risks and Mitigations

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Multiple skill surfaces drift apart. | High | Keep content intentionally parallel in this change and add tests that enumerate the canonical skill list. |
| Host generation misses the new skill. | Medium | Update `REQUIRED_CANONICAL_SKILL_NAMES`, injected routing instructions, and init/update test mirrors together. |
| Tier 3 skill becomes too prescriptive and conflicts with existing c3spec CLI instructions. | Medium | Describe stage responsibilities and artifact gates, but keep CLI command details delegated to existing c3spec skills where possible. |
