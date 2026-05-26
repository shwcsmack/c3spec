# First-Class Agent Hosts Design

## Summary

c3spec will be rebuilt around exactly three first-class agent hosts: Cursor, Claude Code, and Codex. The existing long-tail host adapters will be removed until there is a real need to support another host with the same first-class standard.

The product promise is:

> A user can describe the same c3spec intent in Cursor, Claude Code, or Codex, and the workflow uses the strongest native surfaces available in that host: skills, subagents, hooks, memory instructions, and project config.

The workflow will be prompt-driven rather than slash-command-driven. A user should be able to say something like:

```text
Use c3spec to plan and implement support for X.
```

The host will load the relevant c3spec skill by description. The skill will explicitly instruct the agent to use named subagents for implementation and review. That satisfies Codex's explicit subagent workflow requirement and keeps Cursor and Claude behavior consistent rather than relying on implicit delegation.

## Decisions

- Support only Cursor, Claude Code, and Codex as first-class hosts.
- Remove the other host adapters and tool options for now.
- Use `.agents/` as the canonical source of truth.
- Do not use symlinks; generation must materialize host-specific files.
- Do not generate `.cursor/skills/` for now; Cursor should consume `.agents/skills/` directly.
- Generate `.claude/skills/` because Claude Code does not read `.agents/skills/`.
- Generate native subagent definitions for each host, including Codex TOML agents.
- Drop slash commands entirely so the user can use the same natural-language prompt across hosts.
- Include hooks in this change, but stage the implementation so canonical layout lands before hook generation.

## Canonical Architecture

The source of truth becomes `.agents/`.

```text
.agents/
  skills/
    c3spec-start/
      SKILL.md
    c3spec-tier1-fix/
      SKILL.md
    c3spec-tier2-feature/
      SKILL.md
    c3spec-subagent-dev/
      SKILL.md
    c3spec-host-adapter/
      SKILL.md
  agents/
    implementer.yaml
    spec-reviewer.yaml
    quality-reviewer.yaml
  hooks/
    session-start.yaml
    memory-scan.js
```

Cursor and Codex read `.agents/skills/` directly. Claude Code cannot, so the generator writes materialized copies into `.claude/skills/`. Generated copies are derived artifacts and should be protected by drift detection.

Canonical agent manifests under `.agents/agents/*.yaml` render into each host's native subagent format:

| Host | Generated agents | Notes |
| --- | --- | --- |
| Cursor | `.cursor/agents/<name>.md` | Markdown agents with YAML frontmatter |
| Claude Code | `.claude/agents/<name>.md` | Markdown agents with Claude-specific frontmatter |
| Codex | `.codex/agents/<name>.toml` | TOML agents with `name`, `description`, and `developer_instructions` |

The `c3spec-host-adapter` skill explains host quirks at runtime. Other skills should not say "use the Task tool" or "run `/agent`." They should say "dispatch the `spec-reviewer` agent." The host adapter maps that role to the current host's native subagent mechanism.

## Host Behavior

### Cursor

Cursor consumes canonical skills from `.agents/skills/`. c3spec generates:

```text
.cursor/
  agents/
  hooks.json
  rules/          # optional, only if needed
```

For now, c3spec does not generate `.cursor/skills/`. That avoids a second skill surface that could drift from the canonical `.agents/skills/` source. If testing proves the current Cursor build needs the mirror, it can be added later.

### Claude Code

Claude Code gets:

```text
.claude/
  skills/
  agents/
  settings.json
CLAUDE.md
```

The generated `.claude/skills/` copy exists only because Claude cannot read `.agents/skills/`. If a user edits `.claude/skills/` directly, regeneration should detect the hand edit and point them back to `.agents/skills/`.

### Codex

Codex consumes canonical skills from `.agents/skills/`. c3spec generates:

```text
.codex/
  agents/
  config.toml
  hooks.json
AGENTS.md
```

Codex custom agents are first-class TOML definitions, not a shim. The generated Codex config should pin sane agent defaults:

```toml
[agents]
max_threads = 6
max_depth = 1
```

`max_depth = 1` matches c3spec's controller model: the root orchestrator can spawn implementer and reviewer agents, but worker agents should not recursively spawn more workers.

## Subagent Semantics

The canonical skills should explicitly name the agents to dispatch. For example:

```text
Dispatch the implementer agent for each task in the active stage.
Dispatch the spec-reviewer agent to verify the implementation against the spec delta.
Dispatch the quality-reviewer agent to review maintainability, tests, and code quality.
Mark a task complete only after both reviewers pass.
```

This is intentionally uniform across Cursor, Claude Code, and Codex. Codex documentation says Codex does not spawn subagents automatically, but it does handle orchestration once explicitly asked for a subagent workflow. The c3spec skill text supplies that explicit request.

## Generator and Update Flow

`init`, `sync`, and `update` all run the same generation pipeline:

```text
canonical input
  .agents/skills/*
  .agents/agents/*.yaml
  .agents/hooks/*

pipeline
  validate canonical artifacts
  render host-specific artifacts
  compare generated hashes
  write safe outputs
  report drift / hand edits
```

Expected command behavior:

- `init` creates canonical artifacts if missing, then renders all host outputs.
- `sync` re-renders host outputs from canonical artifacts.
- `update` refreshes bundled canonical artifacts to the current CLI version and regenerates host outputs, with warnings for local canonical edits or hand-edited generated files.

The old command adapter model should be replaced or narrowed into host-generation adapters. The new adapter contract centers skills, agents, hooks, instructions, and config, not slash command files.

Potential adapter methods:

```ts
renderSkills(...)
renderAgents(...)
renderHooks(...)
renderInstructions(...)
renderConfig(...)
```

Adding a future host should require implementing the full host adapter contract rather than only dropping in a markdown command formatter.

## Implementation Stages

### Stage 1: Remove Unsupported Hosts

Delete non-Cursor/Claude/Codex host adapters, remove their `AI_TOOLS` entries, trim factory exports, command-generation tests, config prompts, and docs.

Verification:

- TypeScript compile catches stale imports.
- Tests confirm only three host choices appear.
- No dead adapter files remain.

### Stage 2: Add Canonical `.agents/` Model

Add canonical artifact types and validation:

- skill directories under `.agents/skills/<name>/SKILL.md`
- agent manifests under `.agents/agents/*.yaml`
- hook manifests and scripts under `.agents/hooks/`

Add the five canonical skills:

- `c3spec-start`
- `c3spec-tier1-fix`
- `c3spec-tier2-feature`
- `c3spec-subagent-dev`
- `c3spec-host-adapter`

Add three canonical agents:

- `implementer`
- `spec-reviewer`
- `quality-reviewer`

Verification:

- Fixture validation for canonical manifests.
- Skill frontmatter validation.
- Agent manifest schema validation.

### Stage 3: Build Host Renderers

Build host renderers for:

- Cursor: `.cursor/agents/*.md`, `.cursor/hooks.json`, optional rules
- Claude Code: `.claude/skills/*`, `.claude/agents/*.md`, `.claude/settings.json`, `CLAUDE.md`
- Codex: `.codex/agents/*.toml`, `.codex/config.toml`, `.codex/hooks.json`, `AGENTS.md`

Codex TOML should be generated with correct escaping. Prefer a TOML serializer or a small well-tested writer over ad hoc interpolation where multiline instructions can break.

Verification:

- Snapshot tests for each host output.
- Cross-platform path tests use `path.join()` and `path.resolve()`.
- Generated Codex TOML parses.
- Generated JSON hook files parse.
- Generated Claude/Cursor markdown frontmatter parses.

### Stage 4: Wire `init`, `sync`, and `update`

Make all three commands call the shared generation pipeline. Add generated-file sentinels/hashes so updates are safe.

Expected behavior:

- `init`: creates canonical and host outputs.
- `sync`: re-renders host outputs from canonical.
- `update`: refreshes bundled canonical artifacts and regenerates host outputs, with drift warnings.

Verification:

- End-to-end temp-project tests for `init`, `sync`, and `update`.
- Tests for hand-edited generated file detection.
- Tests for canonical file drift/update prompts or force behavior.

### Stage 5: Dogfood Migration and Docs

Regenerate this repo into the new layout:

- canonical `.agents/skills/`
- generated `.claude/skills/`
- no `.cursor/skills/`
- `.cursor/agents/`
- `.claude/agents/`
- `.codex/agents/`
- hooks/config/instruction files

Update docs/specs to say c3spec supports exactly Cursor, Claude Code, and Codex as first-class hosts. Capture memory and retrospective once verified.

Verification:

- `pnpm test`
- `pnpm build`
- generated workflow sanity checks where possible
- inspect git diff to confirm removed adapters are intentional and no generated drift leaked into unrelated files

## Open Detail Questions for Planning

These are intentionally left for the implementation planning phase, where they can be answered with more code-level context:

- Host detection mechanism for `c3spec-host-adapter`.
- Generated-file sentinel/hash format and overwrite policy.
- Memory-scan hook portability: Node script versus shell scripts per platform.
- Whether Cursor rules are needed immediately or hooks/skills are sufficient.

## Risks

- **Codex format drift:** Codex subagent TOML is documented as potentially evolving as authoring matures. Keep Codex rendering localized and well tested.
- **Generated artifact drift:** Generated `.claude/skills/` and host-specific agents can diverge if users edit them directly. Sentinel/hash checks are required.
- **Hook trust and portability:** Codex project hooks are trust-gated, and hook event schemas differ across hosts. The hook layer must degrade clearly when a host refuses to run a hook.
- **Large removal blast radius:** Removing long-tail adapters simplifies product scope but touches many imports, tests, and docs.

## Approved Scope

This is a single Tier 3 change with staged implementation. It should not be split into separate design contexts; the context and rationale belong in one change so the later hooks work is not divorced from the canonical-layout decisions.
