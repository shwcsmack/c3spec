---
name: c3spec-host-adapter
description: "Map c3spec named agent roles to the current host's native subagent mechanism. Use whenever dispatching implementer, spec-reviewer, or quality-reviewer agents."
---

# C3Spec Host Adapter

Other c3spec skills refer to named agents (`implementer`, `spec-reviewer`, `quality-reviewer`) and to "host-appropriate structured questions" instead of host-specific tool names. Use this skill to translate those references into the native surfaces of the active host.

Canonical agent definitions live under `.agents/agents/*.yaml`. Host renderers may materialize native copies, but at runtime, dispatch using the host mechanism below. Do not require a repo-local generated file to exist before dispatching when the host exposes the role natively.

## Cursor

**Named-agent dispatch.** Cursor exposes the canonical c3spec roles (`implementer`, `spec-reviewer`, `quality-reviewer`) as native subagent types. When a skill says "dispatch the spec-reviewer agent," spawn the Cursor subagent whose role/type matches `spec-reviewer` directly through Cursor's subagent mechanism. The role names match the canonical role names exactly.

Do not require `.cursor/agents/<name>.md` files to exist before dispatching; the roles are available natively even when no repo-local file is present.

**Structured questions.** When a skill says "use a host-appropriate structured question," use Cursor's native structured-question primitive if one is exposed in the current session. Otherwise fall back to a plain numbered prompt as the calling skill describes.

## Claude Code

**Named-agent dispatch.** Dispatch named agents via Claude Code's subagent mechanism using the generated definitions under `.claude/agents/<name>.md`. When a skill says "dispatch the implementer agent," invoke the Claude subagent whose name matches `implementer`.

**Structured questions.** When a skill says "use a host-appropriate structured question," use the `AskUserQuestion` tool when it is available in the session. Otherwise fall back to a plain numbered prompt.

## Codex

**Named-agent dispatch.** Dispatch named custom agents from `.codex/agents/<name>.toml`. When a skill says "dispatch the quality-reviewer agent," invoke the Codex custom agent whose `name` field matches `quality-reviewer`.

**Structured questions.** When a skill says "use a host-appropriate structured question," prefer Codex's native structured-input primitive if one is exposed in the current session. Otherwise fall back to a plain numbered prompt.

## Unsupported host

If the active environment is not Cursor, Claude Code, or Codex:

1. Stop before dispatching subagents.
2. Report that the host is unsupported for first-class c3spec workflows.
3. List the three supported hosts: Cursor, Claude Code, Codex.

Do not guess a fallback dispatch mechanism.

## Detection note

Exact host detection is intentionally left to runtime context. Prefer explicit user or environment signals over brittle heuristics. When uncertain, ask which host is active before dispatching agents.

<!-- c3spec-generated: true
c3spec-source: /Users/shayne/code/c3spec/.worktrees/feat-tier-workflow-resumability/.agents/skills/c3spec-host-adapter/SKILL.md
c3spec-hash: 60aa4055af467e3bf89d84083a41107f840f088c150070d85332a0aab8dcfa78 -->
