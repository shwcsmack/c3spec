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

## 8. Enforce change-folder discipline and archival across all tiers

We need to verify that every workflow actually creates a change folder, lands all artifacts inside it, and archives it on completion — the way upstream OpenSpec did. T2 and T3 nominally follow this, but T1 currently runs inline with no change folder, and there's no automated check that artifacts (proposal, design, specs, tasks, plan, verify, retro) ended up where they belong before the work is called done. Without this we lose the record-of-changes that made the OpenSpec flow auditable.

- Audit each tier skill (`c3spec-tier1-fix`, `c3spec-tier2-feature`, `c3spec-tier3-full`) for where artifacts are written
- Decide whether T1 should also produce a lightweight change folder (e.g., a single `fix-<slug>/notes.md`) so every fix has a paper trail
- Define the canonical artifact set per tier and verify each one is created before archive
- Make `c3spec-archive-change` (or an equivalent step) mandatory at the end of every tier flow
- Add a CLI/skill check that fails if a "completed" change is missing required artifacts or wasn't archived

## 9. Pre-flight clean-tree check at every workflow entry

Every workflow should verify the git working tree is clean before starting work. Right now the user repeatedly has to stash uncommitted changes and clean them up later because skills jump straight into worktree creation, file generation, or commits without checking. A single up-front gate eliminates an entire class of mid-flow surprises.

- Add a clean-tree check to `c3spec-start` so it fires before any tier is even chosen
- Mirror the check at the top of each tier skill so direct entry is also guarded
- Define the policy: hard-block on dirty tree, or offer to stash/commit first?
- Distinguish "dirty tree in source repo" from "dirty tree in worktree" — only the source repo matters for entry
- Make the check cross-platform (no shell-specific `git status` parsing) and surface a clear remediation message

## 10. Collapse the legacy `skills/` pipeline into `.agents/skills/`

The repo has two parallel skill pipelines (see memory: `workflow/two-skill-pipelines.md`). Root `skills/` is the legacy pipeline that feeds `scripts/generate-templates.js` → `src/core/templates/workflows/`. `.agents/skills/` is the first-class pipeline that feeds host-generation via `REQUIRED_CANONICAL_SKILL_NAMES` in `src/core/host-generation/types.ts`. The source of truth should be `.agents/skills/` only — but root `skills/` contains a mix of (a) duplicates of canonical tier skills already in `.agents/skills/` and (b) legacy-only skills (`c3spec-propose`, `c3spec-archive-change`, `c3spec-apply-change`, `c3spec-continue-change`, `c3spec-new-change`, `c3spec-ff-change`, `c3spec-verify-change`, `c3spec-sync-specs`, `c3spec-bulk-archive-change`, `c3spec-onboard`, `c3spec-explore`) that haven't been migrated yet. We can't just delete `skills/` — the tier skills currently reference some of those legacy skills by name. We need to inventory, decide what to keep, migrate the keepers to `.agents/skills/`, then retire the legacy pipeline.

- Inventory every skill under `skills/`: classify each as "duplicate of `.agents/` canonical", "still-needed legacy", or "obsolete"
- Grep `.agents/skills/` and `c3spec/specs/` for references to each legacy skill name to find which ones the first-class flow still depends on
- For duplicates: confirm `.agents/skills/` is authoritative and delete the root copy
- For still-needed legacy skills: migrate them under `.agents/skills/` and add their names to `REQUIRED_CANONICAL_SKILL_NAMES` so host-generation picks them up
- For obsolete skills: delete with a brief rationale captured in the change retro
- Remove `scripts/generate-templates.js` and `src/core/templates/workflows/` once nothing reads from `skills/` anymore
- Update `CLAUDE.md` / `AGENTS.md` to declare `.agents/skills/` as the single source of truth so contributors don't reintroduce the legacy path
- Confirm host-generation regenerates `.cursor/skills/`, `.claude/skills/`, and `.codex/` skill artifacts cleanly after the migration

## 11. Codify the tier workflow contract as a `workflow-routing` spec

The tier system (T1/T2/T3, `c3spec-start` as the front door, dedicated skills per tier) currently lives only in `CLAUDE.md` and the skill files themselves. Other system behaviors in this repo have specs under `c3spec/specs/` with explicit requirements and scenarios; the workflow routing contract does not. Spawned from the Tier 3 skill change (archived as `2026-05-27-tier2-tier3-full-skill`) — when authoring that skill the question came up whether to add a spec, and the answer was "not in that change, but worth doing later as its own thing."

- Define what counts as a tier and how many there are
- Define the required entry path (`c3spec-start` → tier skill)
- Define the canonical skill set per tier and how that list is enforced (constants in `init.ts`/`update.ts`, host-generation coverage)
- Define the routing classifier contract (signals per tier, ambiguous-case rule, user-confirmation gate)
- Define what a tier skill MUST contain (pre-flight, planning, apply, verify, retro, finish, anti-patterns)
- Specify which existing tests/CI checks enforce each requirement

## 12. Make `tasks.md` more extensive and structured

The current Tier 2 `tasks.md` template is a flat bulleted checklist (`- [ ] Task 1: ...`). For anything beyond a trivial feature this collapses too much detail and loses the staging that the plan already implies. Tasks should mirror the staged structure of the plan (`Task 1`, `Task 1.1`, `Task 1.2`, ...) so the task list itself communicates dependencies, stages, and grouping — not just an ordered checklist.

- Define a richer task schema (top-level task → subtasks, grouped by stage)
- Mirror stage boundaries from `plan.md` so tasks and plan share a structure
- Update the Tier 2 (and Tier 3, once it lands) skill so the generated `tasks.md` follows the new structure
- Decide whether checkboxes apply per-subtask, per-task, or both, and update the subagent-dev checkbox discipline accordingly
- Make sure spec-impact, verify, retro, and archive remain visible as their own structured tasks rather than buried in a flat list

## 13. Mandatory context reset before the implementation step

Every tier should pause between planning and implementation, either by handing the apply step to a fresh agent or by clearing the orchestrator's context before code is written. Today the same session that did the brainstorm/proposal/design/plan also drives apply, so it carries hundreds of turns of planning chatter into the code-writing phase — which dilutes attention, leaks half-formed ideas into the implementation, and makes review harder. Subagents already get fresh context, but the orchestrator itself does not, and there's no enforced pause point.

- Investigate which agent runtimes (Cursor, Claude Code, Codex) expose a programmatic context-clear or session-restart hook
- Decide the boundary: clear before `c3spec-apply` / `c3spec-subagent-dev` runs, after the plan is approved
- If runtime-level clearing isn't available, formalize the handoff by spawning a fresh agent (or instructing the user to start a new session) at that boundary
- Encode the pause as an explicit skill step with a checkpoint, not a convention
- Make sure the context-reset boundary preserves the artifacts the apply step needs (paths to plan.md, specs, change folder) — usually via filesystem, not chat history

## 14. Formalize `IDEAS.md` as the backlog with an "add idea" skill

`IDEAS.md` is already where new work lands, but it's an informal convention — there's no skill to add to it, no schema for entries, and no way to capture an idea mid-flow without derailing whatever the agent is currently doing. Mid-chat ideas get lost or shoehorned into the current conversation. The backlog also goes stale — completed ideas linger because nothing prunes them when a change starts or archives. Formalize the file as the project backlog, give it a dedicated capture skill that works from anywhere in the workflow (T1 fix, T2 plan, T3 brainstorm, idle chat) without breaking the active task, and wire it into the change lifecycle so the backlog stays current automatically.

- Define the entry schema (heading style, summary paragraph, bullet list — match the current shape of #1–#13)
- Author a `c3spec-add-idea` skill that takes a short user prompt and appends a properly-formatted entry, auto-numbered, without leaving the current workflow
- Make the skill non-disruptive: it must not switch worktrees, touch the active change folder, or pollute the in-flight plan
- Decide on auto-numbering vs. date-based slugs and how to handle concurrent edits / merge conflicts
- Add a triage command (or extend the skill) that produces a ranking like the one done by hand today
- Update `CLAUDE.md` / routing so "I have an idea, add it to the backlog" goes through this skill instead of inline edits
- Consider whether captured ideas should optionally seed a future `/c3spec:start` interview when picked up later
- Keep the backlog in sync with the change lifecycle: when a change is started (proposal lands in `c3spec/changes/`), prompt to remove or link the originating backlog entry; when a change is archived, automatically remove the entry it traces back to
- Decide how to associate a backlog entry with its change (explicit `change:` slug field on the entry, or fuzzy match on title) so the lifecycle hooks know what to prune
- Add an "audit backlog" step (or skill) that flags entries pointing at already-archived changes so completed work doesn't linger

## 15. Interview one question at a time during `c3spec-start` and brainstorming

Right now when `c3spec-start` runs the "relentless interview" or `superpowers:brainstorming` runs its discovery, the agent tends to fire a numbered batch of questions all at once — sometimes 6–10 in a single message. That's overwhelming, and the user ends up either answering them out of order, missing some, or spending a long block of time before the agent sees any feedback. The agent also can't adapt — the answer to question 1 frequently makes questions 4–6 irrelevant or reshapes them entirely. Single-question interviews are slower per-turn but converge faster overall and feel like a conversation instead of a quiz.

- Update `c3spec-start` Step 2 ("Relentless interview") to require one question per turn, not a numbered batch
- Mirror the same rule into the brainstorming skill (`superpowers:brainstorming` or its vendored equivalent once #4 lands)
- Allow grouped surfacing of *findings* (codebase research, hypotheses) in a single message, but the *question* at the end must be singular
- Permit "stacked" follow-ups in the same turn only when they are tightly coupled (e.g., "soft-block or hard-block? — and if soft, what default option?") and would feel artificial split apart
- Update the "What NOT to do" section of every tier skill and `c3spec-start` to explicitly forbid numbered question dumps
- Decide how to handle the user proactively answering more than was asked — accept the bonus context, don't re-ask, advance the interview accordingly
- Consider a soft cap on interview turns so a one-question-per-turn rule doesn't drag a Tier 1 fix into a 20-question slog
