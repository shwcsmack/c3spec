<!-- c3spec:ideas-digest d48da9cb72523a0cd396549924d1f4d0cb4c6719b36fd63d1beb5ce447266f27 -->
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

## 5. Trigger native agent answer-picker UIs from c3spec skills

Claude Code, Codex, and Cursor each surface a structured "pick an answer" UI when an agent emits the right shape — Cursor has its `AskQuestion` tool, Codex/Claude Code render multi-choice prompts when the assistant message follows specific patterns. c3spec interview steps (`c3spec-start`, brainstorm, design checkpoints) currently fall back to plain markdown bullet lists, which is fine but inconsistent and easy for the human to miss. Research whether each runtime exposes a public API (tool, MCP surface, output convention) for these widgets, or whether deterministic prompt phrasing can get them to pop up reliably — then standardize how c3spec skills request a structured answer so the experience matches the host's native flow.

- Inventory each runtime's answer-picker mechanism: Cursor `AskQuestion` tool surface, Codex / Claude Code message conventions, MCP-based prompts (e.g. `elicit`), and anything plugin-specific
- Identify which mechanisms are publicly documented vs. observed-only, and what guarantees each gives (single-select, multi-select, free-text fallback)
- Test prompt patterns that reliably trigger the picker on each host (numbered options, explicit "choose one" phrasing, structured JSON in fenced blocks) and capture the failure modes
- Decide on a c3spec convention: either a host-adapter helper that emits the right shape per runtime, or a single output format that degrades gracefully when the picker isn't supported
- Update tier and interview skills (`c3spec-start`, `c3spec-tier2-feature`, `c3spec-tier3-full`, brainstorm/design checkpoints) to use the new convention instead of ad-hoc bullet lists
- Document the convention so contributors authoring new skills don't reintroduce inconsistent answer prompts

## 6. Default commit approval mode to always approve all

Today Tier workflows still ask the user at the beginning whether to approve all commits upfront or confirm each commit. For users who always choose the same answer, this prompt is repeated friction. Add a persistent default so commit approval can be preconfigured and the question is skipped unless explicitly overridden.

- Add a user-level setting for commit approval mode (e.g. `always-approve-all`, `per-commit`, `ask`)
- Make `always-approve-all` bypass the upfront question in `c3spec-start`/tier workflows and proceed directly
- Allow one-off overrides per run (for example: a `--per-commit` flag or an explicit phrase in chat)
- Reflect the active mode in workflow output so behavior is transparent
- Update tier skills and lifecycle docs to treat the prompt as conditional on mode, not mandatory
- Add tests covering default behavior, override behavior, and backward compatibility when no setting exists
- Document migration behavior for existing users so current flows continue to work unless they opt in

## 7. Research a Rust port for CLI tooling

Investigate whether c3spec’s CLI should be ported from the current TypeScript/Node stack to Rust to improve startup speed, binary distribution, reliability, and long-term maintainability. This is research-only and should end with a concrete recommendation and migration posture.

- Inventory the current CLI architecture and runtime dependencies that a Rust implementation would need to preserve
- Compare Rust implementation approaches (single static binary, plugin/extension model, config handling, markdown/spec parsing)
- Evaluate migration strategies: full rewrite, hybrid bridge, or incremental command-by-command port
- Assess ecosystem impacts for npm, Homebrew, and Nix install/update flows
- Produce a go/no-go recommendation with risks, prerequisites, and a suggested pilot scope

## 8. Research converting the project into a pi package and going all-in on pi agent

Investigate what it would take to repackage c3spec as a first-class pi package and treat pi agent as the primary runtime/host model instead of maintaining equal-first-class support patterns for multiple hosts. This is research-only and should conclude with a fit assessment and phased recommendation.

- Map current c3spec host/runtime assumptions (Cursor, Claude Code, Codex) against pi package and pi agent primitives
- Identify required changes to skill delivery, host adapter behavior, workflow entrypoints, and developer UX when pi becomes primary
- Evaluate tradeoffs of “pi-first” strategy: maintenance load, compatibility loss, ecosystem lock-in, and contributor workflow impact
- Define migration options: additive support, staged default switch, or full strategic pivot
- Produce a recommendation document with explicit success criteria, blockers, and follow-up ideas

## 9. Auto-resolve ideas after implementation with idea-specific workflow

Design a reliable mechanism to remove or mark ideas complete once the corresponding fix/feature is delivered, potentially via an idea-linked workflow that tracks implementation-to-backlog closure.

- Define how a change links to one or more idea IDs from planning through archive.
- Decide completion behavior: delete idea, mark completed with archive reference, or move to a completed section/log.
- Add an idea-aware workflow step (or dedicated workflow) that enforces closure at archive/finish time.
- Add safeguards for partial fulfillment and multi-idea changes so unresolved scope is not accidentally removed.
