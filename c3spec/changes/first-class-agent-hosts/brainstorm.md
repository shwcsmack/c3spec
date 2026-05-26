# Brainstorm: First-Class Agent Hosts

## Starting Point

The user wants c3spec to support Cursor, Claude Code, and Codex. The initial ambiguity was whether this meant dogfooding support in this repository, CLI scaffolding support for users, or both. The decision was both: make this repository work across all three hosts and update `init`, `sync`, and `update` so generated projects receive the same first-class support.

## Research Findings

### Codex

Current Codex support is not equivalent to the existing c3spec adapter. The existing adapter writes legacy prompt files under `~/.codex/prompts/`, but current Codex documentation and issue history indicate custom prompts were removed in favor of skills.

The relevant Codex surfaces are:

- `.agents/skills/<name>/SKILL.md` for skills
- `.codex/agents/*.toml` for custom subagents
- `.codex/config.toml` for agent defaults and MCP/config
- `.codex/hooks.json` for lifecycle hooks
- `AGENTS.md` for repo instructions

Codex documentation says Codex does not spawn subagents automatically and should only use subagents when explicitly asked. It also says Codex handles orchestration once asked, including spawning subagents, routing follow-up instructions, waiting for results, and closing threads. Therefore c3spec skills should explicitly ask for named subagents. This gives Codex the required authorization and keeps Cursor/Claude behavior consistent.

### Cursor

Cursor reads `.agents/skills/`, so c3spec does not need to generate `.cursor/skills/` initially. Cursor gets native generated subagents under `.cursor/agents/` and hooks under `.cursor/hooks.json`.

### Claude Code

Claude Code does not read `.agents/skills/`, so c3spec must generate `.claude/skills/` as a materialized copy of canonical skills. Claude also gets generated `.claude/agents/`, `.claude/settings.json`, and `CLAUDE.md`.

## Options Considered

### Option 1: Minimal skill parity

Use one canonical skill set and copy or symlink it for each host.

Rejected because it does not use Codex custom agents, Cursor/Claude subagents, hooks, or host-native config. It would make Codex support feel like a shim.

### Option 2: Adapter-aware skills

Keep one canonical skill template and lightly transform it per host.

Rejected as the final direction because it risks three drifting skill bodies and makes generated copies the place where the tool differences live.

### Option 3: Full first-class support from one canonical source

Use `.agents/` as the canonical source and generate each host's native artifacts:

- skills
- subagents
- hooks
- instruction files
- config

Chosen because it preserves one source of truth while still using each host's strongest native surface.

## Decisions

- Support only Cursor, Claude Code, and Codex.
- Delete other adapters rather than keep them as partial shims.
- Use `.agents/` as the canonical source of truth.
- Do not use symlinks; generation must materialize host-specific outputs.
- Do not generate `.cursor/skills/` for now because Cursor reads `.agents/skills/` directly.
- Generate `.claude/skills/` because Claude does not read `.agents/skills/`.
- Generate first-class Codex TOML agents under `.codex/agents/`.
- Drop slash commands entirely so users can use similar prompts across all hosts.
- Canonical skills should explicitly instruct the host to dispatch named subagents.
- Include hooks in the same change, but stage implementation so the canonical layout lands before hooks.

## Open Questions Deferred to Planning/Implementation

- Exact host detection mechanism for `c3spec-host-adapter`.
- Exact sentinel/hash format for generated-file drift detection.
- Whether the memory hook should be a Node script only or have host-specific wrappers.
- Whether Cursor rules are needed immediately or hooks/skills are sufficient.

## Chosen Direction

One Tier 3 change with staged implementation:

1. Remove unsupported host surface.
2. Add canonical `.agents/` artifacts.
3. Build host renderers.
4. Wire `init`, `sync`, and `update`.
5. Dogfood and verify.
