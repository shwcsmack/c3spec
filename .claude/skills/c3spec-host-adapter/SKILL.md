---
name: c3spec-host-adapter
description: "Map c3spec named agent roles to the current host's native subagent mechanism. Use whenever dispatching implementer, spec-reviewer, or quality-reviewer agents."
---

# C3Spec Host Adapter

Other c3spec skills refer to named agents (`implementer`, `spec-reviewer`, `quality-reviewer`) instead of host-specific tools. Use this skill to translate those roles into the native subagent surface for the active host.

Canonical agent definitions live under `.agents/agents/*.yaml`. Host renderers materialize native copies; at runtime, dispatch using the host mechanism below.

## Cursor

Dispatch named agents via Cursor's subagent mechanism using the generated definitions under `.cursor/agents/<name>.md`.

When a skill says "dispatch the spec-reviewer agent," spawn or invoke the Cursor subagent whose name matches `spec-reviewer`.

## Claude Code

Dispatch named agents via Claude Code's subagent mechanism using the generated definitions under `.claude/agents/<name>.md`.

When a skill says "dispatch the implementer agent," invoke the Claude subagent whose name matches `implementer`.

## Codex

Dispatch named custom agents from `.codex/agents/<name>.toml`.

When a skill says "dispatch the quality-reviewer agent," invoke the Codex custom agent whose `name` field matches `quality-reviewer`.

## Unsupported host

If the active environment is not Cursor, Claude Code, or Codex:

1. Stop before dispatching subagents.
2. Report that the host is unsupported for first-class c3spec workflows.
3. List the three supported hosts: Cursor, Claude Code, Codex.

Do not guess a fallback dispatch mechanism.

## Detection note

Exact host detection is intentionally left to runtime context. Prefer explicit user or environment signals over brittle heuristics. When uncertain, ask which host is active before dispatching agents.

<!-- c3spec-generated: true
c3spec-source: /Users/shayne/code/c3spec/.worktrees/first-class-agent-hosts/.agents/skills/c3spec-host-adapter/SKILL.md
c3spec-hash: fd167ef696f024b9ca5ac5c2129d926cac8f37b1bd9af77a100071f151927ae7 -->
