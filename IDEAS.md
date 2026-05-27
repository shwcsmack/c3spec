# Ideas

Backlog of ideas to pick up later. Each entry is intentionally light - flesh out via `/c3spec:start` when ready to work on it.

## 1. Rewrite the README for c3spec branding

Replace the upstream `@fission-ai/openspec` README content with c3spec-specific branding, positioning, and installation instructions. Make it clear this is a Code 3 Dev fork tailored for our workflow, not a drop-in for upstream OpenSpec.

- New project name, taglines, and intro
- Installation instructions for the `c3spec` CLI (pnpm-based)
- Quickstart that reflects our tiered workflow (`/c3spec:start` as the front door)
- Link to upstream OpenSpec with attribution
- Screenshots/examples using c3spec commands, not openspec

## 2. Strip instrumentation inherited from upstream

Remove PostHog and any other telemetry/instrumentation carried over from the upstream OpenSpec codebase. We don't want to be sending events to someone else's analytics, and we're not ready to wire up our own yet.

- Audit for PostHog SDK usage and any analytics calls
- Remove related dependencies from `package.json`
- Remove related config/env vars
- Confirm no residual init code runs on CLI startup

## 3. Codebase audit - find and remove what we don't need

Do a thorough pass through the codebase to identify code, features, commands, dependencies, and assets that exist because of upstream but aren't valuable for our use case. Goal: shrink the surface area so the project is easier to reason about and modify.

- Walk the CLI command tree and flag commands we don't use
- Identify unused modules / dead code
- Look at `package.json` dependencies for things we can drop
- Look at templates, fixtures, examples for stale content
- Produce a removal plan before deleting anything

## 4. Bring superpowers into the project (vendor the tooling)

Currently we depend on the `superpowers` plugin via the Cursor/Claude plugin system. Bring those skills into this repo so we have full control over them, can modify them for c3spec's workflow, and don't depend on an external plugin staying available.

- Decide what to vendor (all skills? a subset?)
- Pick a location (likely under `.cursor/skills/` or `c3spec/skills/`)
- Adapt skill content to reference c3spec terminology and tiers
- Update CLAUDE.md / AGENTS.md routing to point at vendored copies
- Document the divergence from upstream superpowers

## 5. Research agent tooling we could bundle

Survey the agent-tooling landscape (MCP servers, CLI utilities, helper scripts, etc.) and identify tools worth bundling with c3spec so users get a richer agent environment out of the box. Output is a research doc, not an implementation.

- Inventory what's broadly useful across project types
- Compare MCP servers, CLI tools, and skill-based approaches
- Note licensing / distribution constraints for bundling
- Recommend a starter set + a way for users to extend it

## 6. Lightweight webserver tool for agent to human HTML handoff

The CLAUDE.md "HTML artifact rule" currently has agents print a `file://` path for the human to paste into a browser. Explore giving the agent the ability to spin up a tiny local webserver so HTML design docs render with assets, navigation, and live-reload-friendly URLs instead of raw file paths.

- Research existing minimal-webserver approaches (Node `http`, Bun, Python `http.server`, dedicated tools)
- Decide how the agent invokes it (skill? CLI subcommand? MCP tool?)
- Figure out port management, lifecycle, and cleanup
- Make sure it's cross-platform (macOS / Linux / Windows)
- Define the UX: what does the agent print to the human now?

## 7. Research HITL / HOTL methodologies for this workflow

We already have human-in-the-loop checkpoints (HTML artifact approvals, commit approval). Do a deeper research pass on human-in-the-loop (HITL) and human-on-the-loop (HOTL) methodologies and figure out where else they belong in the c3spec workflow.

- Define HITL vs HOTL clearly for this project
- Map current approval points across T1 / T2 / T3 tiers
- Identify gaps where the agent currently goes too long without human checkpoint
- Identify spots where we over-interrupt and could move to HOTL
- Propose concrete changes to skills / routing / CLAUDE.md

## 8. Author a `c3spec-tier3-full` SKILL.md

Tier 1 and Tier 2 each have a dedicated skill file (`c3spec-tier1-fix`, `c3spec-tier2-feature`) that lays out every step. Tier 3 currently doesn't — `c3spec-start` Step 4 hands off with a single sentence ("Begin the full superpowers-bridge flow...") and the agent then stitches together `c3spec-propose`, `c3spec-apply-change`, `superpowers:brainstorming`, etc. on the fly. The result is inconsistent Tier 3 runs and silent drift between sessions.

- Capture the canonical Tier 3 flow end-to-end (brainstorm → proposal → design → specs → tasks → plan → apply → verify → retro → archive)
- Define HTML-review checkpoints at each planning artifact, matching the Tier 2 pattern
- Spell out which existing skills to invoke at each step (`c3spec-propose`, `c3spec-subagent-dev`, `c3spec-archive-change`, etc.) so the agent isn't improvising
- Update `c3spec-start` Step 4 to route to the new skill by name instead of describing the flow inline
- Mirror the "What NOT to do" anti-pattern section from `c3spec-tier1-fix`

9. We need to verify that we are creating changes in a change folder, creating all the artifacts in that change folder, and then archiving that change so that we are keeping a record of all the changes made just like the openspec flow did.
10. Every one of the workflows should verify the git tree is clean first before starting work. There are too many times that I have to deal with stashing things and cleaning them up later.
11. Do we need the /agents folder, everything should be in .agents now right?

## 12. Codify the tier workflow contract as a `workflow-routing` spec

The tier system (T1/T2/T3, `c3spec-start` as the front door, dedicated skills per tier) currently lives only in `CLAUDE.md` and the skill files themselves. Other system behaviors in this repo have specs under `c3spec/specs/` with explicit requirements and scenarios; the workflow routing contract does not. Spawned from the Tier 3 skill change (idea #8) — when authoring that skill the question came up whether to add a spec, and the answer was "not in that change, but worth doing later as its own thing."

- Define what counts as a tier and how many there are
- Define the required entry path (`c3spec-start` → tier skill)
- Define the canonical skill set per tier and how that list is enforced (constants in `init.ts`/`update.ts`, host-generation coverage)
- Define the routing classifier contract (signals per tier, ambiguous-case rule, user-confirmation gate)
- Define what a tier skill MUST contain (pre-flight, planning, apply, verify, retro, finish, anti-patterns)
- Specify which existing tests/CI checks enforce each requirement

## 13. Make `tasks.md` more extensive and structured

The current Tier 2 `tasks.md` template is a flat bulleted checklist (`- [ ] Task 1: ...`). For anything beyond a trivial feature this collapses too much detail and loses the staging that the plan already implies. Tasks should mirror the staged structure of the plan (`Task 1`, `Task 1.1`, `Task 1.2`, ...) so the task list itself communicates dependencies, stages, and grouping — not just an ordered checklist.

- Define a richer task schema (top-level task → subtasks, grouped by stage)
- Mirror stage boundaries from `plan.md` so tasks and plan share a structure
- Update the Tier 2 (and Tier 3, once it lands) skill so the generated `tasks.md` follows the new structure
- Decide whether checkboxes apply per-subtask, per-task, or both, and update the subagent-dev checkbox discipline accordingly
- Make sure spec-impact, verify, retro, and archive remain visible as their own structured tasks rather than buried in a flat list

14. We should always pause before implimenting step, either to run it on a different agent or to clear the context before writing the code. Maybe check if the agents we are using can clear their own context and that would automate the process.
