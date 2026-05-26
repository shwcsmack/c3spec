## Why

c3spec currently advertises many AI tool adapters, but the project workflow is only being actively designed and dogfooded for Cursor, Claude Code, and Codex. That broad adapter surface creates maintenance cost, stale behavior, and weak Codex support: the current Codex command adapter writes legacy prompt files under `~/.codex/prompts/`, a surface that current Codex has replaced with skills and custom agents.

This change makes c3spec opinionated: Cursor, Claude Code, and Codex become first-class hosts with native skills, subagents, hooks, memory instructions, and project config. All other adapters are removed until there is a real need to support them to the same standard.

## What Changes

**Supported hosts**

- From: many advertised AI tools with uneven support.
- To: exactly three first-class hosts: Cursor, Claude Code, and Codex.
- Reason: reduce unsupported surface area and make each supported host excellent.
- Impact: users selecting removed tools must wait until those hosts are deliberately reintroduced.

**Canonical workflow source**

- From: per-tool generated skills and slash command files.
- To: canonical `.agents/` artifacts:
  - `.agents/skills/*/SKILL.md`
  - `.agents/agents/*.yaml`
  - `.agents/hooks/*`
- Reason: one source of truth for workflow instructions, subagent roles, and hooks.
- Impact: generated host artifacts are derived and protected from drift.

**Host-specific generation**

- Cursor consumes `.agents/skills/` directly and receives generated `.cursor/agents/` and `.cursor/hooks.json`.
- Claude Code receives generated `.claude/skills/`, `.claude/agents/`, `.claude/settings.json`, and `CLAUDE.md`.
- Codex consumes `.agents/skills/` directly and receives generated `.codex/agents/*.toml`, `.codex/config.toml`, `.codex/hooks.json`, and `AGENTS.md`.

**Workflow invocation**

- From: slash-command files such as `/c3spec:*` or `opsx-*`.
- To: natural-language prompt invocation through description-triggered skills.
- Reason: users should be able to use substantially the same prompt across Cursor, Claude Code, and Codex.
- Impact: command generation is removed from the primary setup/update pipeline.

**Subagent orchestration**

- From: tool-specific assumptions embedded in workflow instructions.
- To: canonical skills explicitly dispatch named roles such as `implementer`, `spec-reviewer`, and `quality-reviewer`.
- Reason: Codex requires explicit subagent workflow instructions, and explicit delegation improves consistency in Cursor and Claude Code too.
- Impact: role definitions are generated into each host's native subagent format.

**Hooks and memory**

- From: memory scan is an instruction agents must remember.
- To: generated host hook config runs a canonical memory-scan hook where supported and trusted.
- Reason: make project memory less dependent on the model remembering Step 0.
- Impact: hook behavior must handle trust-gating and host schema differences.

## Capabilities

### New Capabilities

- `canonical-agent-artifacts`: `.agents/` is the source of truth for skills, agent roles, and hooks.
- `host-generation`: host renderers generate native Cursor, Claude Code, and Codex artifacts from canonical inputs.
- `c3spec-host-adapter`: a canonical skill describes how to map named c3spec roles to the current host's native subagent mechanism.
- `memory-hook-generation`: generated hooks enforce or surface the memory scan at session start.

### Modified Capabilities

- `ai-tool-paths`: supported tools shrink to Cursor, Claude Code, and Codex, with `.agents/skills/` canonical for Cursor and Codex.
- `command-generation`: slash-command generation is retired for the core workflow and replaced by host-generation.
- `cli-init`: initialization creates canonical artifacts and renders host-specific outputs for the three supported hosts.
- `cli-update`: update refreshes canonical artifacts and derived host outputs with drift protection.
- `skill-template-codegen`: bundled workflow content must include the new tier-based skills and host-adapter skill.

## Impact

- `src/core/config.ts`: trim `AI_TOOLS` to Cursor, Claude Code, and Codex.
- `src/core/command-generation/`: remove long-tail command adapters and replace/narrow the command adapter registry.
- `src/core/init.ts`: call the shared host generation pipeline instead of generating skills and slash commands per selected tool.
- `src/core/update.ts`: refresh canonical artifacts and derived host outputs through the shared pipeline.
- `src/core/shared/`: add canonical artifact parsing, validation, rendering, hashing, and drift detection helpers.
- `.agents/`: new canonical skills, agent manifests, and hook sources.
- `.claude/`, `.cursor/`, `.codex/`: generated host artifacts for dogfooding this repository.
- Tests: update tool selection, generation snapshots, parser validation, drift detection, and init/update end-to-end coverage.

## Non-Goals

- Do not preserve slash-command generation for the core c3spec workflow.
- Do not keep unsupported host adapters as "best effort" shims.
- Do not use symlinks for generated host artifacts.
- Do not generate `.cursor/skills/` unless later testing proves Cursor cannot reliably consume `.agents/skills/`.
- Do not design recursive subagent workflows; the root orchestrator dispatches workers, and workers do not spawn more workers.
