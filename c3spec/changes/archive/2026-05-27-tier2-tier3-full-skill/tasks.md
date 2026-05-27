# Tasks: Tier 3 Full Workflow Skill

- [x] Task 1: Add the Tier 3 skill canonical source in `.agents/skills/c3spec-tier3-full/SKILL.md`
- [x] Task 2: Add the bundled parallel copy in `skills/c3spec-tier3-full/SKILL.md` (parity per Decision 1)
- [x] Task 3: Update `c3spec-start` in both `.agents/skills/` and `skills/` so Tier 3 routes to `c3spec-tier3-full`
- [x] Task 4: Update `REQUIRED_CANONICAL_SKILL_NAMES` in `src/core/host-generation/types.ts` and the injected routing table in `src/core/host-generation/renderers/instructions.ts` to include Tier 3
- [x] Task 5: Update `CANONICAL_SKILL_NAMES` in `test/core/init.test.ts` and `test/core/update.test.ts` to mirror the new constant
- [x] Task 6: Run `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm check:codegen`; fix any drift
