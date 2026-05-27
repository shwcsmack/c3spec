# Ideas

Backlog of ideas to pick up later. Each entry is intentionally light - flesh out via `/c3spec:start` when ready to work on it.

## 1. Rewrite the README for c3spec branding

Replace the upstream `@fission-ai/openspec` README content with c3spec-specific branding, positioning, and installation instructions. Make it clear this is a Code 3 Dev fork tailored for our workflow, not a drop-in for upstream OpenSpec.

- New project name, taglines, and intro
- Installation instructions for the `c3spec` CLI (pnpm-based)
- Quickstart that reflects our tiered workflow (`/c3spec:start` as the front door)
- Link to upstream OpenSpec with attribution
- Screenshots/examples using c3spec commands, not openspec

## 2. Codebase audit - find and remove what we don't need

Do a thorough pass through the codebase to identify code, features, commands, dependencies, and assets that exist because of upstream but aren't valuable for our use case. Goal: shrink the surface area so the project is easier to reason about and modify.

- Walk the CLI command tree and flag commands we don't use
- Identify unused modules / dead code
- Look at `package.json` dependencies for things we can drop
- Look at templates, fixtures, examples for stale content
- Produce a removal plan before deleting anything

## 3. Bring superpowers into the project (vendor the tooling)

Currently we depend on the `superpowers` plugin via the Cursor/Claude plugin system. Bring those skills into this repo so we have full control over them, can modify them for c3spec's workflow, and don't depend on an external plugin staying available.

- Decide what to vendor (all skills? a subset?)
- Pick a location (likely under `.cursor/skills/` or `c3spec/skills/`)
- Adapt skill content to reference c3spec terminology and tiers
- Update CLAUDE.md / AGENTS.md routing to point at vendored copies
- Document the divergence from upstream superpowers

## 4. Research agent tooling we could bundle

Survey the agent-tooling landscape (MCP servers, CLI utilities, helper scripts, etc.) and identify tools worth bundling with c3spec so users get a richer agent environment out of the box. Output is a research doc, not an implementation.

- Inventory what's broadly useful across project types
- Compare MCP servers, CLI tools, and skill-based approaches
- Note licensing / distribution constraints for bundling
- Recommend a starter set + a way for users to extend it

## 5. Lightweight webserver tool for agent to human HTML handoff

The CLAUDE.md "HTML artifact rule" currently has agents print a `file://` path for the human to paste into a browser. Explore giving the agent the ability to spin up a tiny local webserver so HTML design docs render with assets, navigation, and live-reload-friendly URLs instead of raw file paths.

- Research existing minimal-webserver approaches (Node `http`, Bun, Python `http.server`, dedicated tools)
- Decide how the agent invokes it (skill? CLI subcommand? MCP tool?)
- Figure out port management, lifecycle, and cleanup
- Make sure it's cross-platform (macOS / Linux / Windows)
- Define the UX: what does the agent print to the human now?

## 6. Research HITL / HOTL methodologies for this workflow

We already have human-in-the-loop checkpoints (HTML artifact approvals, commit approval). Do a deeper research pass on human-in-the-loop (HITL) and human-on-the-loop (HOTL) methodologies and figure out where else they belong in the c3spec workflow.

- Define HITL vs HOTL clearly for this project
- Map current approval points across T1 / T2 / T3 tiers
- Identify gaps where the agent currently goes too long without human checkpoint
- Identify spots where we over-interrupt and could move to HOTL
- Propose concrete changes to skills / routing / CLAUDE.md

## 7. Make `tasks.md` more extensive and structured

The current Tier 2 `tasks.md` template is a flat bulleted checklist (`- [ ] Task 1: ...`). For anything beyond a trivial feature this collapses too much detail and loses the staging that the plan already implies. Tasks should mirror the staged structure of the plan (`Task 1`, `Task 1.1`, `Task 1.2`, ...) so the task list itself communicates dependencies, stages, and grouping — not just an ordered checklist.

- Define a richer task schema (top-level task → subtasks, grouped by stage)
- Mirror stage boundaries from `plan.md` so tasks and plan share a structure
- Update the Tier 2 (and Tier 3, once it lands) skill so the generated `tasks.md` follows the new structure
- Decide whether checkboxes apply per-subtask, per-task, or both, and update the subagent-dev checkbox discipline accordingly
- Make sure spec-impact, verify, retro, and archive remain visible as their own structured tasks rather than buried in a flat list

## 8. Mandatory context reset before the implementation step

Every tier should pause between planning and implementation, either by handing the apply step to a fresh agent or by clearing the orchestrator's context before code is written. Today the same session that did the brainstorm/proposal/design/plan also drives apply, so it carries hundreds of turns of planning chatter into the code-writing phase — which dilutes attention, leaks half-formed ideas into the implementation, and makes review harder. Subagents already get fresh context, but the orchestrator itself does not, and there's no enforced pause point.

- Investigate which agent runtimes (Cursor, Claude Code, Codex) expose a programmatic context-clear or session-restart hook
- Decide the boundary: clear before `c3spec-apply` / `c3spec-subagent-dev` runs, after the plan is approved
- If runtime-level clearing isn't available, formalize the handoff by spawning a fresh agent (or instructing the user to start a new session) at that boundary
- Encode the pause as an explicit skill step with a checkpoint, not a convention
- Make sure the context-reset boundary preserves the artifacts the apply step needs (paths to plan.md, specs, change folder) — usually via filesystem, not chat history

## 9. Formalize `IDEAS.md` as the backlog with an "add idea" skill

`IDEAS.md` is already where new work lands, but it's an informal convention — there's no skill to add to it, no schema for entries, and no way to capture an idea mid-flow without derailing whatever the agent is currently doing. Mid-chat ideas get lost or shoehorned into the current conversation. The backlog also goes stale — completed ideas linger because nothing prunes them when a change starts or archives. Formalize the file as the project backlog, give it a dedicated capture skill that works from anywhere in the workflow (T1 fix, T2 plan, T3 brainstorm, idle chat) without breaking the active task, and wire it into the change lifecycle so the backlog stays current automatically.

- Define the entry schema (heading style, summary paragraph, bullet list — match the current shape of #1–#8)
- Author a `c3spec-add-idea` skill that takes a short user prompt and appends a properly-formatted entry, auto-numbered, without leaving the current workflow
- Make the skill non-disruptive: it must not switch worktrees, touch the active change folder, or pollute the in-flight plan
- Decide on auto-numbering vs. date-based slugs and how to handle concurrent edits / merge conflicts
- Add a triage command (or extend the skill) that produces a ranking like the one done by hand today
- Update `CLAUDE.md` / routing so "I have an idea, add it to the backlog" goes through this skill instead of inline edits
- Consider whether captured ideas should optionally seed a future `/c3spec:start` interview when picked up later
- Keep the backlog in sync with the change lifecycle: when a change is started (proposal lands in `c3spec/changes/`), prompt to remove or link the originating backlog entry; when a change is archived, automatically remove the entry it traces back to
- Decide how to associate a backlog entry with its change (explicit `change:` slug field on the entry, or fuzzy match on title) so the lifecycle hooks know what to prune
- Add an "audit backlog" step (or skill) that flags entries pointing at already-archived changes so completed work doesn't linger

## 10. Audit and clean out pre-fork content in `c3spec/changes/`

`c3spec/changes/` still carries a large amount of content produced upstream before the c3spec fork — both active-looking change folders at the root (e.g. `add-artifact-regeneration-support`, `add-change-stacking-awareness`, `add-global-install-scope`, `add-qa-smoke-harness`, `add-tool-command-surface-capabilities`, `simplify-skill-installation`, `unify-template-generation-pipeline`, `workspace-*`, `tier2-c3spec-bootstrap`, etc.) and ~80 entries under `archive/` dated from `2025-01-11` through `2026-04-23` (well before the fork). Because c3spec is a clean break from upstream and we don't cherry-pick from there, this content is mostly noise — it pollutes `c3spec list`, dilutes the audit trail, and makes it harder to see what's actually been built on c3spec. We should audit, classify, and prune so the changes folder reflects only c3spec history (plus anything we explicitly want to keep as inherited record).

- Inventory every entry under `c3spec/changes/` (root-level folders) and `c3spec/changes/archive/`, classify each as: produced-on-c3spec, pre-fork upstream, or ambiguous
- Use `git log` on each folder to confirm fork-vs-c3spec authorship rather than relying on filename dates alone
- Decide the retention policy per category:
  - Produced-on-c3spec: keep as-is
  - Pre-fork archived: delete, or move under a clearly labeled `archive/upstream-pre-fork/` subdirectory if we want to preserve provenance
  - Pre-fork still-active root folders: archive them as historical, or delete if they describe upstream-only capabilities we'll never ship
- Confirm that pruning the folders does not break `c3spec list`, `c3spec archive`, or any spec-sync logic that scans `c3spec/changes/`
- Cross-reference with `c3spec/specs/` — some pre-fork changes may have left orphan spec capabilities that should also be cleaned (overlaps with idea #2 codebase audit)
- Document the cleanup in a single change folder so the prune itself is auditable
- Update `IMPLEMENTATION_ORDER.md` (still in the changes root) if it references entries that get removed

## 11. Enforce requirements of ALL specs with backing tests

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

## 12. Trigger native agent answer-picker UIs from c3spec skills

Claude Code, Codex, and Cursor each surface a structured "pick an answer" UI when an agent emits the right shape — Cursor has its `AskQuestion` tool, Codex/Claude Code render multi-choice prompts when the assistant message follows specific patterns. c3spec interview steps (`c3spec-start`, brainstorm, design checkpoints) currently fall back to plain markdown bullet lists, which is fine but inconsistent and easy for the human to miss. Research whether each runtime exposes a public API (tool, MCP surface, output convention) for these widgets, or whether deterministic prompt phrasing can get them to pop up reliably — then standardize how c3spec skills request a structured answer so the experience matches the host's native flow.

- Inventory each runtime's answer-picker mechanism: Cursor `AskQuestion` tool surface, Codex / Claude Code message conventions, MCP-based prompts (e.g. `elicit`), and anything plugin-specific
- Identify which mechanisms are publicly documented vs. observed-only, and what guarantees each gives (single-select, multi-select, free-text fallback)
- Test prompt patterns that reliably trigger the picker on each host (numbered options, explicit "choose one" phrasing, structured JSON in fenced blocks) and capture the failure modes
- Decide on a c3spec convention: either a host-adapter helper that emits the right shape per runtime, or a single output format that degrades gracefully when the picker isn't supported
- Update tier and interview skills (`c3spec-start`, `c3spec-tier2-feature`, `c3spec-tier3-full`, brainstorm/design checkpoints) to use the new convention instead of ad-hoc bullet lists
- Document the convention so contributors authoring new skills don't reintroduce inconsistent answer prompts

## 13. Audit the standalone `schemas/` system — keep, fold in, or remove

The repo has a `schemas/` directory at the root (`spec-driven`, `workspace-planning`) plus a sibling `c3spec/schemas/superpowers-bridge/`, each shipping a `schema.yaml` and a `templates/` folder. None of the current tier skills, `c3spec-start`, or host-generation pipeline appear to reach into these schemas — the artifact templates the tier skills actually emit live inline in the SKILL.md content under `.agents/skills/`. The runtime validation under `src/core/schemas/` (spec/change Zod schemas) is a separate system and is in active use, so the audit is specifically about the YAML-schema-with-templates directories, not the runtime validators. Figure out whether these schema bundles are still wired in anywhere, whether they're upstream-pre-fork residue (overlaps with idea #10), or whether there's latent value we should fold back into the tier skills.

- Trace every reader of `schemas/spec-driven/`, `schemas/workspace-planning/`, and `c3spec/schemas/superpowers-bridge/` — CLI commands, skill content, host-generation, tests — and document each reference
- Distinguish "no code reads this" from "code reads this but nothing user-facing exercises it" so we don't delete a path that's just dormant
- Compare the templates in those bundles against the inline templates the current tier skills emit; flag anything in the schema bundles that's strictly better and worth backporting into the tier skills
- Check `c3spec/schemas/superpowers-bridge/` specifically — it looks intentional and c3spec-era, decide whether it's part of the long-term plan or an unfinished experiment
- Decide the disposition per bundle: keep + wire back in, fold useful pieces into the tier skill content and delete, or delete outright with a brief rationale captured in the change retro
- If deleting, make sure `c3spec list`, validation, and host-generation still pass and that the relevant spec/capability is also updated or retired
- Coordinate with idea #10 (pre-fork content audit) so we don't do two passes over the same upstream residue

## 14. Research pi agent and explore c3spec integration

Investigate "pi agent" as a potential runtime or collaborator for c3spec — first as standalone research (what it is, how it works, its primitives, strengths, and limits) and then specifically how it could interoperate with c3spec's tiered workflow. Today c3spec treats Cursor, Claude Code, and Codex as first-class hosts via `c3spec-host-adapter` and bundled skill delivery; pi agent, if it fits, would be a new host, a sub-runtime for subagent dispatch, a tool surface, or something orthogonal — the goal of this idea is to figure out which (or "none"). Output is a research doc, not an implementation — but the doc should be concrete enough to either close as "no fit" or spawn a follow-up proposal.

- **Phase 1 — pi agent itself:** what it is, who maintains it, license / distribution model, runtime shape (CLI, service, embedded library), skill / tool / hook surfaces, prompt-handling model, current adopters and maturity signals
- **Phase 2 — c3spec fit assessment:** classify it against c3spec's existing seams — host runtime (like Cursor / Claude Code / Codex), subagent target (like the `implementer` / `spec-reviewer` / `quality-reviewer` roles), tool surface (MCP-like), or something we don't have a slot for yet
- Identify the smallest viable integration story per classification, e.g. "c3spec dispatches subagents into pi agent" vs. "pi agent gets the same `.agents/skills/` bundle as Cursor" vs. "pi agent calls c3spec CLI as an external tool"
- Map what would have to change in `c3spec-host-adapter`, host-generation, `.agents/skills/` delivery, slash-command templates, and the CLI surfaces to accommodate the chosen story
- Surface blockers and open questions up front — licensing, prompt-format compatibility, missing primitives (subagent dispatch? hooks? structured answer-picker?) — so the research is honest about what we don't know
- Cross-reference with idea #4 (bundled agent tooling survey) and idea #12 (native answer-picker UIs) — overlap is likely and worth coordinating instead of duplicating
- Output: a single research doc under `docs/research/pi-agent-fit.md` (or similar), plus 0–N follow-up ideas appended to `IDEAS.md` if the research surfaces concrete work

## 15. Refactor `runCLI` test helper to in-process invocation

`test/helpers/run-cli.ts` spawns a real `dist/cli/index.js` Node subprocess for every CLI invocation in a test. With 4 test files (`workspace.test.ts`, `validate.test.ts`, `artifact-workflow.test.ts`, `cli-e2e/basic.test.ts`) issuing 5–10 `runCLI` calls per test, the per-subprocess cold-start cost (~0.5–1.5s on a warm cache) reliably exceeds vitest's default 10s `testTimeout` — the bandaid for that lives in `vitest.config.ts` today (`testTimeout: 30000`, see comment + IDEAS #15 backref). The bandaid hides real latency: a single workspace test that issues 8 CLI calls is paying ~8–12s of pure subprocess overhead to assert on output text. Refactor `runCLI` to invoke the CLI in-process — import the program builder, call `parseAsync` against a fresh `Command` instance, capture stdout/stderr through a writable buffer — so tests cost milliseconds instead of seconds and we can drop the timeout bump.

- Audit `runCLI` call sites across the 4 affected test files; document how each one depends on subprocess semantics (process exit code, signal handling, env isolation, stdio framing)
- Design an in-process replacement that preserves the public `RunCLIResult` shape (`exitCode`, `signal`, `stdout`, `stderr`, `timedOut`, `command`) so tests don't need rewrites
- Handle Commander's `process.exit` calls — either configure the program with `exitOverride()` and translate thrown `CommanderError` into the result, or run inside a stubbed `process.exit` interceptor
- Capture stdout/stderr by patching `process.stdout.write` / `process.stderr.write` for the duration of the call (with strict cleanup in `finally`) instead of relying on real pipes
- Reset module state between invocations if the CLI carries top-level mutable state (env caches, config singletons, registries) — surface what state actually leaks
- Preserve a subprocess fallback for the small number of cases that genuinely need it (e.g., `cli-e2e/basic.test.ts` smoke checks asserting the bin actually launches) so we don't over-collapse
- After landing, revert `vitest.config.ts` timeouts to defaults (or document why a smaller bump is still needed) and remove the IDEAS #15 backref from the config comment
- Measure before/after: report wall-clock time for the full suite and for `workspace.test.ts` alone so the win is visible
- Coordinate with idea #11 (spec → backing-test enforcement) — that work will add tests; if the new tests use `runCLI`, they benefit immediately from the in-process refactor

## 16. Investigate why quality-review subagents run so slowly

Quality review (`quality-reviewer` subagent dispatched from `c3spec-subagent-dev`) consistently takes much longer than other subagent roles in the same workflow — minutes per task even on small skill-content changes — and it's noticeable enough that it has become the long pole of every tier change. Today there's no measurement, no profiling, and no breakdown of where the time goes (model latency, tool-call count, repeated file reads, oversized context, prompt verbosity, parallelism limits, host-specific overhead). Treat this as a measurement problem first, not a tuning problem: find out where the time actually goes, then decide what to fix.

- Instrument quality-review runs end-to-end: capture wall-clock per subagent invocation, count of tool calls made, total tokens in / out, and a rough breakdown of phases (context load → analysis → write findings)
- Compare against `spec-reviewer` and `implementer` runs on the same task to confirm quality review is actually the slow one (or whether it just feels slower) and quantify the gap
- Audit the quality-review prompt and skill content for prompt bloat — long preambles, repeated rules, redundant context — and see how much of the input is fixed overhead vs. task-specific signal
- Audit what the subagent re-reads on each invocation (tier skills, lifecycle skill, sibling artifacts, generated host copies); look for redundant fetches and oversized file reads that could be narrowed
- Check parallelism: are quality-review runs serialized across tasks even when independent? `c3spec-subagent-dev` orchestrates this, so confirm whether the bottleneck is sequencing rather than per-invocation cost
- Check host differences: time the same review under Cursor vs. Claude Code vs. Codex to see if the slowdown is review-specific or host-specific (i.e., is it the role, the runtime, or the model)
- Consider scoped quality reviews — e.g. "review only the diff touching X" instead of "review the whole change" — and measure the speedup vs. the loss of catch rate before adopting
- Output a short profiling report under `docs/research/` summarizing where the time goes and proposing the smallest fix that closes the gap, before opening a follow-up implementation idea
- Coordinate with idea #15 (in-process `runCLI` refactor) only if the profiling shows subprocess overhead is part of the slowdown — otherwise keep these tracks separate

## 17. Make the git workflow opinionated end-to-end

Every tier skill (`c3spec-tier1-fix`, `c3spec-tier2-feature`, `c3spec-tier3-full`) front-loads the same battery of git questions before doing any work — "approve all commits upfront, or confirm each one individually?", a stash/commit/abort prompt when the tree isn't clean, and at the close `superpowers:finishing-a-development-branch` opens yet another decision loop (merge / PR / cleanup). The net effect is the human has to drive the git lifecycle by hand even on small fixes, and the end of a change regularly needs explicit re-prompting like "now commit this", "now push", "now open the PR" before the agent acts. c3spec should pick defaults and live with them — branch naming, commit cadence, push timing, PR opening, cleanup — so the agent commits, pushes, and opens PRs on its own under a single named policy, with one explicit opt-out for the rare case the human wants to deviate.

- Inventory every git-related question across the tier skills and the `superpowers:finishing-a-development-branch` handoff; classify each as "needs an answer", "could be defaulted", or "should never have been asked in the first place"
- Pick opinionated defaults for the high-frequency questions: per-artifact commits as each pause-point is approved (not "approve upfront vs per-commit"), branch name derived from the change slug, push after each approved artifact, PR opened once the change is archive-ready
- Replace the upfront "approve all commits or per-commit?" prompt in all three tier skills with a fixed policy — commit every pause-point artifact as it's approved, no per-commit re-asking — and document the policy in one place rather than re-stating it per tier
- Default the clean-tree gate behavior without a question: surface the dirty paths and abort, rather than offering stash/commit/abort each time; the human can rerun once they've handled their tree
- Define a single opt-out lever (mirroring the "fast forward" phrase from idea #16) so a user can say "don't auto-push" or "don't open a PR" once at the start of a change instead of being re-prompted later in the flow
- Make end-of-change actions opinionated: when archive is approved, the agent should commit + push + open the PR automatically with a templated description, rather than waiting for "now push" / "now open the PR" / "write the PR description" from the human
- Pick a PR description convention up front (link to change folder, list of approved artifacts, retro summary for Tier 3) so the agent doesn't interview the user about PR contents at the end
- Audit `superpowers:finishing-a-development-branch` — decide whether to keep it, fork it as a c3spec-native finisher with fewer prompts, or skip it entirely in favor of an opinionated archive→commit→push→PR sequence baked into the tier skills (coordinates with idea #3 vendoring superpowers)
- Surface the policy in `CLAUDE.md` / `AGENTS.md` so it's discoverable, and pin it in `c3spec-tier-lifecycle` so the tier skills consume one source of truth instead of each re-implementing the prompts
- Coordinate with idea #6 (HITL/HOTL methodologies) and idea #16 (per-artifact approval pauses) — git decisions are a major HITL surface and the same "opinionated default + one named opt-out" pattern should apply consistently across both
 
## 18. Deepen the brainstorm interview workflow

The brainstorm step is one of the highest-leverage points in the c3spec flow, but right now interview quality can vary by host, context length, and operator habits. We should tighten this into a more opinionated interview experience: thorough discovery, one question at a time, and clear recommendations paired with each question so the user can make fast decisions without losing nuance.

- Define a brainstorm interview contract that requires one question per turn and forbids bundled numbered question dumps
- Require each question to be either open-ended or multiple-choice, and document when each mode is preferred
- Require the agent to include a recommendation with every question (for multiple-choice: recommended option first; for open-ended: suggested direction and why)
- Clarify what “thorough” means for brainstorming depth: problem framing, constraints, alternatives, risks, and acceptance signals before moving to proposal
- Update `c3spec-explore`, `c3spec-start`, and any brainstorm step in tier skills so they all use the same interview posture
- Add focused tests (or skill-contract assertions) that catch regressions to multi-question dumps or missing recommendations
- Decide how to reflect user-selected answers in downstream artifacts so recommendations are traceable into proposal/design
