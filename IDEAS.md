<!-- c3spec:ideas-digest 43c5563c14598b31b948b8275189137aa21bc2d63e065102b543005d398d03b1 -->
# Ideas

Backlog of ideas to pick up later. Each entry is intentionally light - flesh out via `/c3spec:start` when ready to work on it.

## 1. Research agent tooling we could bundle

Survey the agent-tooling landscape (MCP servers, CLI utilities, helper scripts, etc.) and identify tools worth bundling with c3spec so users get a richer agent environment out of the box. Output is a research doc, not an implementation.

- Inventory what's broadly useful across project types
- Compare MCP servers, CLI tools, and skill-based approaches
- Note licensing / distribution constraints for bundling
- Recommend a starter set + a way for users to extend it

## 2. Lightweight webserver tool for agent to human HTML handoff

The CLAUDE.md "HTML artifact rule" currently has agents print a `file://` path for the human to paste into a browser. Explore giving the agent the ability to spin up a tiny local webserver so HTML design docs render with assets, navigation, and live-reload-friendly URLs instead of raw file paths.

- Research existing minimal-webserver approaches (Node `http`, Bun, Python `http.server`, dedicated tools)
- Decide how the agent invokes it (skill? CLI subcommand? MCP tool?)
- Figure out port management, lifecycle, and cleanup
- Make sure it's cross-platform (macOS / Linux / Windows)
- Define the UX: what does the agent print to the human now?

## 3. Research HITL / HOTL methodologies for this workflow

We already have human-in-the-loop checkpoints (HTML artifact approvals, commit approval). Do a deeper research pass on human-in-the-loop (HITL) and human-on-the-loop (HOTL) methodologies and figure out where else they belong in the c3spec workflow.

- Define HITL vs HOTL clearly for this project
- Map current approval points across T1 / T2 / T3 tiers
- Identify gaps where the agent currently goes too long without human checkpoint
- Identify spots where we over-interrupt and could move to HOTL
- Propose concrete changes to skills / routing / CLAUDE.md

## 4. Mandatory context reset before the implementation step

Every tier should pause between planning and implementation, either by handing the apply step to a fresh agent or by clearing the orchestrator's context before code is written. Today the same session that did the brainstorm/proposal/design/plan also drives apply, so it carries hundreds of turns of planning chatter into the code-writing phase — which dilutes attention, leaks half-formed ideas into the implementation, and makes review harder. Subagents already get fresh context, but the orchestrator itself does not, and there's no enforced pause point.

- Investigate which agent runtimes (Cursor, Claude Code, Codex) expose a programmatic context-clear or session-restart hook
- Decide the boundary: clear before `c3spec-apply` / `c3spec-subagent-dev` runs, after the plan is approved
- If runtime-level clearing isn't available, formalize the handoff by spawning a fresh agent (or instructing the user to start a new session) at that boundary
- Encode the pause as an explicit skill step with a checkpoint, not a convention
- Make sure the context-reset boundary preserves the artifacts the apply step needs (paths to plan.md, specs, change folder) — usually via filesystem, not chat history

## 5. Enforce requirements of ALL specs with backing tests

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

## 6. Trigger native agent answer-picker UIs from c3spec skills

Claude Code, Codex, and Cursor each surface a structured "pick an answer" UI when an agent emits the right shape — Cursor has its `AskQuestion` tool, Codex/Claude Code render multi-choice prompts when the assistant message follows specific patterns. c3spec interview steps (`c3spec-start`, brainstorm, design checkpoints) currently fall back to plain markdown bullet lists, which is fine but inconsistent and easy for the human to miss. Research whether each runtime exposes a public API (tool, MCP surface, output convention) for these widgets, or whether deterministic prompt phrasing can get them to pop up reliably — then standardize how c3spec skills request a structured answer so the experience matches the host's native flow.

- Inventory each runtime's answer-picker mechanism: Cursor `AskQuestion` tool surface, Codex / Claude Code message conventions, MCP-based prompts (e.g. `elicit`), and anything plugin-specific
- Identify which mechanisms are publicly documented vs. observed-only, and what guarantees each gives (single-select, multi-select, free-text fallback)
- Test prompt patterns that reliably trigger the picker on each host (numbered options, explicit "choose one" phrasing, structured JSON in fenced blocks) and capture the failure modes
- Decide on a c3spec convention: either a host-adapter helper that emits the right shape per runtime, or a single output format that degrades gracefully when the picker isn't supported
- Update tier and interview skills (`c3spec-start`, `c3spec-tier2-feature`, `c3spec-tier3-full`, brainstorm/design checkpoints) to use the new convention instead of ad-hoc bullet lists
- Document the convention so contributors authoring new skills don't reintroduce inconsistent answer prompts

## 7. Default commit approval mode to always approve all

Today Tier workflows still ask the user at the beginning whether to approve all commits upfront or confirm each commit. For users who always choose the same answer, this prompt is repeated friction. Add a persistent default so commit approval can be preconfigured and the question is skipped unless explicitly overridden.

- Add a user-level setting for commit approval mode (e.g. `always-approve-all`, `per-commit`, `ask`)
- Make `always-approve-all` bypass the upfront question in `c3spec-start`/tier workflows and proceed directly
- Allow one-off overrides per run (for example: a `--per-commit` flag or an explicit phrase in chat)
- Reflect the active mode in workflow output so behavior is transparent
- Update tier skills and lifecycle docs to treat the prompt as conditional on mode, not mandatory
- Add tests covering default behavior, override behavior, and backward compatibility when no setting exists
- Document migration behavior for existing users so current flows continue to work unless they opt in

## 8. Research a Rust port for CLI tooling

Investigate whether c3spec’s CLI should be ported from the current TypeScript/Node stack to Rust to improve startup speed, binary distribution, reliability, and long-term maintainability. This is research-only and should end with a concrete recommendation and migration posture.

- Inventory the current CLI architecture and runtime dependencies that a Rust implementation would need to preserve
- Compare Rust implementation approaches (single static binary, plugin/extension model, config handling, markdown/spec parsing)
- Evaluate migration strategies: full rewrite, hybrid bridge, or incremental command-by-command port
- Assess ecosystem impacts for npm, Homebrew, and Nix install/update flows
- Produce a go/no-go recommendation with risks, prerequisites, and a suggested pilot scope

## 9. Research converting the project into a pi package and going all-in on pi agent

Investigate what it would take to repackage c3spec as a first-class pi package and treat pi agent as the primary runtime/host model instead of maintaining equal-first-class support patterns for multiple hosts. This is research-only and should conclude with a fit assessment and phased recommendation.

- Map current c3spec host/runtime assumptions (Cursor, Claude Code, Codex) against pi package and pi agent primitives
- Identify required changes to skill delivery, host adapter behavior, workflow entrypoints, and developer UX when pi becomes primary
- Evaluate tradeoffs of “pi-first” strategy: maintenance load, compatibility loss, ecosystem lock-in, and contributor workflow impact
- Define migration options: additive support, staged default switch, or full strategic pivot
- Produce a recommendation document with explicit success criteria, blockers, and follow-up ideas

## 10. Require interview/grill-me phase in every tier workflow

Add a mandatory interview (grill-me) phase to every workflow tier so assumptions are surfaced early and alignment is explicit before planning or implementation begins.

- Define a standard interview contract for Tier 1, Tier 2, and Tier 3 with pacing and output expectations.
- Require each tier skill to run the interview phase even after c3spec-start handoff, with context-aware depth by tier.
- Document how interview findings are captured in change artifacts and influence routing/design decisions.
- Add spec/tests to enforce that tier workflows include and honor the interview phase.

## 11. Fix subagent-driven development flow and PI setup for subagent execution

Stabilize and simplify the c3spec subagent-driven development flow, including reliable PI environment/setup for subagent work so implementation and review agents can be dispatched consistently across hosts.

- Audit current c3spec-subagent-dev orchestration steps for failure points, drift, and host-specific assumptions.
- Define and implement a deterministic PI setup/bootstrap step required before subagent dispatch.
- Update c3spec-host-adapter and related skills to enforce/setup subagent prerequisites automatically.
- Add tests covering subagent dispatch readiness, failure handling, and cross-host behavior.

## 12. Fix finishing-development-branch flow at end of every workflow

Harden the branch-finalization flow so every workflow consistently ends with a reliable finishing-development-branch step and clear PR-ready output.

- Audit where c3spec-finishing-development-branch is invoked (or skipped) across Tier 1/2/3 and archive paths.
- Standardize end-of-workflow invocation contract, including required inputs and expected outputs.
- Improve failure handling/retry guidance when finalization checks fail.
- Add tests ensuring each workflow path reaches finishing-development-branch under the correct conditions.

## 13. Auto-resolve ideas after implementation with idea-specific workflow

Design a reliable mechanism to remove or mark ideas complete once the corresponding fix/feature is delivered, potentially via an idea-linked workflow that tracks implementation-to-backlog closure.

- Define how a change links to one or more idea IDs from planning through archive.
- Decide completion behavior: delete idea, mark completed with archive reference, or move to a completed section/log.
- Add an idea-aware workflow step (or dedicated workflow) that enforces closure at archive/finish time.
- Add safeguards for partial fulfillment and multi-idea changes so unresolved scope is not accidentally removed.
