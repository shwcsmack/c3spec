## Why

Agents running `c3spec-start` and Tier 3 brainstorming often dump six to ten numbered questions in one message. That overwhelms users, prevents adaptive follow-ups, and diverges from the superpowers-bridge brainstorm instruction that already expects one clarifying question at a time. We need the tier workflow contract and canonical skills to enforce conversational single-question interviews.

## What Changes

**c3spec-start relentless interview**
- From: Step 2 encourages interviewing until aligned but does not constrain question batching.
- To: Step 2 requires one interview question per turn, allows grouped findings with a single closing question, and documents exceptions for tightly coupled clarifications.
- Reason: Routing interviews should feel like a conversation, not a quiz.
- Impact: Non-breaking workflow behavior clarification.

**Tier skill anti-patterns**
- From: Tier 1 forbids re-interview; Tier 2/3 lack explicit batching bans.
- To: All tier skills forbid numbered question dumps and require one clarifying question per turn when follow-up is needed.
- Reason: Handoff should not restart batched interviewing.
- Impact: Non-breaking.

**workflow-routing spec**
- From: Spec covers front door and tiers but not interview pacing.
- To: New `One-question interview pacing` requirement with scenarios for start, Tier 3 brainstorm, bonus answers, and tier follow-ups.
- Reason: Dogfood the behavior in `c3spec/specs/`.
- Impact: Spec-level contract addition.

**Host artifacts**
- From: Generated `.claude/skills/` copies may lag `.agents/skills/`.
- To: Regenerate via `c3spec update` after canonical skill edits.
- Impact: Keeps Cursor/Claude/Codex outputs aligned.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `workflow-routing`: Add interview pacing requirement and scenarios.

## Impact

- `.agents/skills/c3spec-start/SKILL.md`
- `.agents/skills/c3spec-tier{1,2,3}-*/SKILL.md`
- `skills/c3spec-start/SKILL.md` and tier skill duplicates (legacy pipeline, per memory)
- `c3spec/specs/workflow-routing/spec.md`
- `c3spec/changes/tier2-one-question-interviews/specs/workflow-routing/spec.md`
- `test/specs/workflow-routing-interview-pacing.test.ts`
- `.claude/skills/*` via `c3spec update`

## Non-Goals

- Vendoring or editing external `superpowers:brainstorming` plugin content (IDEAS #3).
- Changing `c3spec/schemas/superpowers-bridge/schema.yaml` (already says one at a time).
- IDEAS.md backlog pruning in this change.
