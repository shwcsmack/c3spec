# Ideas

Backlog of ideas to pick up later. Each entry is intentionally light - flesh out via `/c3spec:start` when ready to work on it.

## 1. Codebase audit - find and remove what we don't need (partially complete)

Do a thorough pass through the codebase to identify code, features, commands, dependencies, and assets that exist because of upstream but aren't valuable for our use case. Goal: shrink the surface area so the project is easier to reason about and modify.

Status (2026-05-27):
- Completed in `audit-pre-fork-and-codebase-prune`: major history pruning, stale `IMPLEMENTATION_ORDER.md` removal, command-guidance cleanup, and full-suite verification.
- Remaining: high-risk removals that need a dedicated follow-up change (deprecated command-surface removal, deeper schema/doc residue cleanup).

- Walk the CLI command tree and flag commands we don't use
- Identify unused modules / dead code
- Look at `package.json` dependencies for things we can drop
- Look at templates, fixtures, examples for stale content
- Produce a removal plan before deleting anything

## 2. Bring superpowers into the project (vendor the tooling)

Currently we depend on the `superpowers` plugin via the Cursor/Claude plugin system. Bring those skills into this repo so we have full control over them, can modify them for c3spec's workflow, and don't depend on an external plugin staying available.

- Decide what to vendor (all skills? a subset?)
- Pick a location (likely under `.cursor/skills/` or `c3spec/skills/`)
- Adapt skill content to reference c3spec terminology and tiers
- Update CLAUDE.md / AGENTS.md routing to point at vendored copies
- Document the divergence from upstream superpowers

## 3. Research agent tooling we could bundle

Survey the agent-tooling landscape (MCP servers, CLI utilities, helper scripts, etc.) and identify tools worth bundling with c3spec so users get a richer agent environment out of the box. Output is a research doc, not an implementation.

- Inventory what's broadly useful across project types
- Compare MCP servers, CLI tools, and skill-based approaches
- Note licensing / distribution constraints for bundling
- Recommend a starter set + a way for users to extend it

## 4. Lightweight webserver tool for agent to human HTML handoff

The CLAUDE.md "HTML artifact rule" currently has agents print a `file://` path for the human to paste into a browser. Explore giving the agent the ability to spin up a tiny local webserver so HTML design docs render with assets, navigation, and live-reload-friendly URLs instead of raw file paths.

- Research existing minimal-webserver approaches (Node `http`, Bun, Python `http.server`, dedicated tools)
- Decide how the agent invokes it (skill? CLI subcommand? MCP tool?)
- Figure out port management, lifecycle, and cleanup
- Make sure it's cross-platform (macOS / Linux / Windows)
- Define the UX: what does the agent print to the human now?

## 5. Research HITL / HOTL methodologies for this workflow

We already have human-in-the-loop checkpoints (HTML artifact approvals, commit approval). Do a deeper research pass on human-in-the-loop (HITL) and human-on-the-loop (HOTL) methodologies and figure out where else they belong in the c3spec workflow.

- Define HITL vs HOTL clearly for this project
- Map current approval points across T1 / T2 / T3 tiers
- Identify gaps where the agent currently goes too long without human checkpoint
- Identify spots where we over-interrupt and could move to HOTL
- Propose concrete changes to skills / routing / CLAUDE.md

## 6. Make `tasks.md` more extensive and structured

The current Tier 2 `tasks.md` template is a flat bulleted checklist (`- [ ] Task 1: ...`). For anything beyond a trivial feature this collapses too much detail and loses the staging that the plan already implies. Tasks should mirror the staged structure of the plan (`Task 1`, `Task 1.1`, `Task 1.2`, ...) so the task list itself communicates dependencies, stages, and grouping — not just an ordered checklist.

- Define a richer task schema (top-level task → subtasks, grouped by stage)
- Mirror stage boundaries from `plan.md` so tasks and plan share a structure
- Update the Tier 2 (and Tier 3, once it lands) skill so the generated `tasks.md` follows the new structure
- Decide whether checkboxes apply per-subtask, per-task, or both, and update the subagent-dev checkbox discipline accordingly
- Make sure spec-impact, verify, retro, and archive remain visible as their own structured tasks rather than buried in a flat list

## 7. Mandatory context reset before the implementation step

Every tier should pause between planning and implementation, either by handing the apply step to a fresh agent or by clearing the orchestrator's context before code is written. Today the same session that did the brainstorm/proposal/design/plan also drives apply, so it carries hundreds of turns of planning chatter into the code-writing phase — which dilutes attention, leaks half-formed ideas into the implementation, and makes review harder. Subagents already get fresh context, but the orchestrator itself does not, and there's no enforced pause point.

- Investigate which agent runtimes (Cursor, Claude Code, Codex) expose a programmatic context-clear or session-restart hook
- Decide the boundary: clear before `c3spec-apply` / `c3spec-subagent-dev` runs, after the plan is approved
- If runtime-level clearing isn't available, formalize the handoff by spawning a fresh agent (or instructing the user to start a new session) at that boundary
- Encode the pause as an explicit skill step with a checkpoint, not a convention
- Make sure the context-reset boundary preserves the artifacts the apply step needs (paths to plan.md, specs, change folder) — usually via filesystem, not chat history

## 8. Enforce requirements of ALL specs with backing tests

Today the only cross-spec enforcement in this repo is `test/specs/source-specs-normalization.test.ts`, which checks the *shape* of every `c3spec/specs/*/spec.md` (Purpose + Requirements sections, no delta headers, no placeholder text, parseable requirements). Behavioral alignment between each `### Requirement: …` and the code that implements it is trusted entirely to human discipline and `opsx-verify-skill` runs at change time — there is no CI signal when a requirement loses its backing test, or when an implementation drifts away from the requirement it was supposed to satisfy. We dogfood spec-driven development, so the bar should be higher: every requirement in every spec should be traceable to at least one test that exercises it, and CI should fail when that link breaks. Explore what this looks like end-to-end before committing to an implementation.

- Decide what "backing test" means: a test that asserts the requirement's behavior, a test that exists in a file the spec maps to, or a stronger explicit link (e.g., requirement IDs referenced in test names or describe blocks)
- Inventory current state: for each spec under `c3spec/specs/`, count how many requirements are plausibly covered by existing tests vs trusted-by-convention; produce a baseline so the gap is visible
- Pick a linking mechanism — options include: stable requirement IDs in spec headers (e.g., `### Requirement: [WR-001] Tier set definition`), a sidecar `spec.coverage.yaml` per capability, a `requirement:` annotation convention in test names, or a build-time index that scans both sides
- Decide enforcement strength: warn-only at first, then fail CI when a requirement has no backing test or a test references a requirement ID that no longer exists
- Handle the bootstrap problem honestly — most existing specs will fail on day one; design a migration path (allow-list, per-spec opt-in, or a "must not regress" baseline that hardens over time)
- Avoid over-coupling: tests must still be readable on their own; a `requirement:` annotation should add information, not become the only way to understand what the test does
- Cover the inverse drift case: when a requirement is deleted or renamed via the archive flow, the matching tests/annotations should be flagged for cleanup rather than silently orphaned
- Surface coverage in a way agents and humans both consume: a `c3spec coverage` subcommand or a generated report under `c3spec/` that shows per-spec status
- Spawned from the completed workflow-routing spec change — that change deliberately stayed docs-only because no precedent exists for new-test-per-requirement work; this idea is where that precedent gets set

## 9. Trigger native agent answer-picker UIs from c3spec skills

Claude Code, Codex, and Cursor each surface a structured "pick an answer" UI when an agent emits the right shape — Cursor has its `AskQuestion` tool, Codex/Claude Code render multi-choice prompts when the assistant message follows specific patterns. c3spec interview steps (`c3spec-start`, brainstorm, design checkpoints) currently fall back to plain markdown bullet lists, which is fine but inconsistent and easy for the human to miss. Research whether each runtime exposes a public API (tool, MCP surface, output convention) for these widgets, or whether deterministic prompt phrasing can get them to pop up reliably — then standardize how c3spec skills request a structured answer so the experience matches the host's native flow.

- Inventory each runtime's answer-picker mechanism: Cursor `AskQuestion` tool surface, Codex / Claude Code message conventions, MCP-based prompts (e.g. `elicit`), and anything plugin-specific
- Identify which mechanisms are publicly documented vs. observed-only, and what guarantees each gives (single-select, multi-select, free-text fallback)
- Test prompt patterns that reliably trigger the picker on each host (numbered options, explicit "choose one" phrasing, structured JSON in fenced blocks) and capture the failure modes
- Decide on a c3spec convention: either a host-adapter helper that emits the right shape per runtime, or a single output format that degrades gracefully when the picker isn't supported
- Update tier and interview skills (`c3spec-start`, `c3spec-tier2-feature`, `c3spec-tier3-full`, brainstorm/design checkpoints) to use the new convention instead of ad-hoc bullet lists
- Document the convention so contributors authoring new skills don't reintroduce inconsistent answer prompts

## 10. Audit the standalone `schemas/` system — keep, fold in, or remove

The repo has a `schemas/` directory at the root (`spec-driven`, `workspace-planning`) plus a sibling `c3spec/schemas/superpowers-bridge/`, each shipping a `schema.yaml` and a `templates/` folder. None of the current tier skills, `c3spec-start`, or host-generation pipeline appear to reach into these schemas — the artifact templates the tier skills actually emit live inline in the SKILL.md content under `.agents/skills/`. The runtime validation under `src/core/schemas/` (spec/change Zod schemas) is a separate system and is in active use, so the audit is specifically about the YAML-schema-with-templates directories, not the runtime validators. Figure out whether these schema bundles are still wired in anywhere, whether they're upstream-pre-fork residue (overlaps with completed pre-fork cleanup work), or whether there's latent value we should fold back into the tier skills.

- Trace every reader of `schemas/spec-driven/`, `schemas/workspace-planning/`, and `c3spec/schemas/superpowers-bridge/` — CLI commands, skill content, host-generation, tests — and document each reference
- Distinguish "no code reads this" from "code reads this but nothing user-facing exercises it" so we don't delete a path that's just dormant
- Compare the templates in those bundles against the inline templates the current tier skills emit; flag anything in the schema bundles that's strictly better and worth backporting into the tier skills
- Check `c3spec/schemas/superpowers-bridge/` specifically — it looks intentional and c3spec-era, decide whether it's part of the long-term plan or an unfinished experiment
- Decide the disposition per bundle: keep + wire back in, fold useful pieces into the tier skill content and delete, or delete outright with a brief rationale captured in the change retro
- If deleting, make sure `c3spec list`, validation, and host-generation still pass and that the relevant spec/capability is also updated or retired
- Coordinate with the completed pre-fork cleanup so we don't do two passes over the same upstream residue

## 11. Research pi agent and explore c3spec integration

Investigate "pi agent" as a potential runtime or collaborator for c3spec — first as standalone research (what it is, how it works, its primitives, strengths, and limits) and then specifically how it could interoperate with c3spec's tiered workflow. Today c3spec treats Cursor, Claude Code, and Codex as first-class hosts via `c3spec-host-adapter` and bundled skill delivery; pi agent, if it fits, would be a new host, a sub-runtime for subagent dispatch, a tool surface, or something orthogonal — the goal of this idea is to figure out which (or "none"). Output is a research doc, not an implementation — but the doc should be concrete enough to either close as "no fit" or spawn a follow-up proposal.

- **Phase 1 — pi agent itself:** what it is, who maintains it, license / distribution model, runtime shape (CLI, service, embedded library), skill / tool / hook surfaces, prompt-handling model, current adopters and maturity signals
- **Phase 2 — c3spec fit assessment:** classify it against c3spec's existing seams — host runtime (like Cursor / Claude Code / Codex), subagent target (like the `implementer` / `spec-reviewer` / `quality-reviewer` roles), tool surface (MCP-like), or something we don't have a slot for yet
- Identify the smallest viable integration story per classification, e.g. "c3spec dispatches subagents into pi agent" vs. "pi agent gets the same `.agents/skills/` bundle as Cursor" vs. "pi agent calls c3spec CLI as an external tool"
- Map what would have to change in `c3spec-host-adapter`, host-generation, `.agents/skills/` delivery, slash-command templates, and the CLI surfaces to accommodate the chosen story
- Surface blockers and open questions up front — licensing, prompt-format compatibility, missing primitives (subagent dispatch? hooks? structured answer-picker?) — so the research is honest about what we don't know
- Cross-reference with idea #4 (bundled agent tooling survey) and idea #11 (native answer-picker UIs) — overlap is likely and worth coordinating instead of duplicating
- Output: a single research doc under `docs/research/pi-agent-fit.md` (or similar), plus 0–N follow-up ideas appended to `IDEAS.md` if the research surfaces concrete work

## 12. Investigate why quality-review subagents run so slowly

Quality review (`quality-reviewer` subagent dispatched from `c3spec-subagent-dev`) consistently takes much longer than other subagent roles in the same workflow — minutes per task even on small skill-content changes — and it's noticeable enough that it has become the long pole of every tier change. Today there's no measurement, no profiling, and no breakdown of where the time goes (model latency, tool-call count, repeated file reads, oversized context, prompt verbosity, parallelism limits, host-specific overhead). Treat this as a measurement problem first, not a tuning problem: find out where the time actually goes, then decide what to fix.

- Instrument quality-review runs end-to-end: capture wall-clock per subagent invocation, count of tool calls made, total tokens in / out, and a rough breakdown of phases (context load → analysis → write findings)
- Compare against `spec-reviewer` and `implementer` runs on the same task to confirm quality review is actually the slow one (or whether it just feels slower) and quantify the gap
- Audit the quality-review prompt and skill content for prompt bloat — long preambles, repeated rules, redundant context — and see how much of the input is fixed overhead vs. task-specific signal
- Audit what the subagent re-reads on each invocation (tier skills, lifecycle skill, sibling artifacts, generated host copies); look for redundant fetches and oversized file reads that could be narrowed
- Check parallelism: are quality-review runs serialized across tasks even when independent? `c3spec-subagent-dev` orchestrates this, so confirm whether the bottleneck is sequencing rather than per-invocation cost
- Check host differences: time the same review under Cursor vs. Claude Code vs. Codex to see if the slowdown is review-specific or host-specific (i.e., is it the role, the runtime, or the model)
- Consider scoped quality reviews — e.g. "review only the diff touching X" instead of "review the whole change" — and measure the speedup vs. the loss of catch rate before adopting
- Output a short profiling report under `docs/research/` summarizing where the time goes and proposing the smallest fix that closes the gap, before opening a follow-up implementation idea
- Coordinate with idea #14 (in-process `runCLI` refactor) only if the profiling shows subprocess overhead is part of the slowdown — otherwise keep these tracks separate

## 13. Deepen the brainstorm interview workflow

The brainstorm step is one of the highest-leverage points in the c3spec flow, but right now interview quality can vary by host, context length, and operator habits. We should tighten this into a more opinionated interview experience: thorough discovery, one question at a time, and clear recommendations paired with each question so the user can make fast decisions without losing nuance.

- Define a brainstorm interview contract that requires one question per turn and forbids bundled numbered question dumps
- Require each question to be either open-ended or multiple-choice, and document when each mode is preferred
- Require the agent to include a recommendation with every question (for multiple-choice: recommended option first; for open-ended: suggested direction and why)
- Clarify what “thorough” means for brainstorming depth: problem framing, constraints, alternatives, risks, and acceptance signals before moving to proposal
- Update `c3spec-explore`, `c3spec-start`, and any brainstorm step in tier skills so they all use the same interview posture
- Add focused tests (or skill-contract assertions) that catch regressions to multi-question dumps or missing recommendations
- Decide how to reflect user-selected answers in downstream artifacts so recommendations are traceable into proposal/design

## 14. Default commit approval mode to always approve all

Today Tier workflows still ask the user at the beginning whether to approve all commits upfront or confirm each commit. For users who always choose the same answer, this prompt is repeated friction. Add a persistent default so commit approval can be preconfigured and the question is skipped unless explicitly overridden.

- Add a user-level setting for commit approval mode (e.g. `always-approve-all`, `per-commit`, `ask`)
- Make `always-approve-all` bypass the upfront question in `c3spec-start`/tier workflows and proceed directly
- Allow one-off overrides per run (for example: a `--per-commit` flag or an explicit phrase in chat)
- Reflect the active mode in workflow output so behavior is transparent
- Update tier skills and lifecycle docs to treat the prompt as conditional on mode, not mandatory
- Add tests covering default behavior, override behavior, and backward compatibility when no setting exists
- Document migration behavior for existing users so current flows continue to work unless they opt in
