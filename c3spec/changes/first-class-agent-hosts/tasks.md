## 1. Remove unsupported host surface

- [x] 1.1 Trim `AI_TOOLS` to `cursor`, `claude`, and `codex`
- [x] 1.2 Delete non-Cursor/Claude/Codex command adapter files
- [x] 1.3 Remove stale adapter exports and registry entries
- [x] 1.4 Update interactive and non-interactive tool selection tests for the three-host list
- [x] 1.5 Update documentation and error copy that lists supported tools

## 2. Add canonical `.agents/` artifact model

- [x] 2.1 Define canonical skill metadata and required skill names
- [x] 2.2 Define canonical agent manifest schema and parser
- [x] 2.3 Define canonical hook manifest schema and parser
- [x] 2.4 Add bundled canonical skill templates for `c3spec-start`, `c3spec-tier1-fix`, `c3spec-tier2-feature`, `c3spec-subagent-dev`, and `c3spec-host-adapter`
- [x] 2.5 Add bundled canonical agent manifests for `implementer`, `spec-reviewer`, and `quality-reviewer`
- [x] 2.6 Add bundled canonical memory-scan hook source

## 3. Build host renderers

- [x] 3.1 Create a host generation adapter contract
- [x] 3.2 Implement Cursor renderer for `.cursor/agents/` and `.cursor/hooks.json`
- [x] 3.3 Implement Claude renderer for `.claude/skills/`, `.claude/agents/`, `.claude/settings.json`, and `CLAUDE.md`
- [x] 3.4 Implement Codex renderer for `.codex/agents/*.toml`, `.codex/config.toml`, `.codex/hooks.json`, and `AGENTS.md`
- [x] 3.5 Add generated-file sentinel/hash support
- [x] 3.6 Add parser tests for generated JSON, TOML, markdown frontmatter, and sentinels

## 4. Wire generation into commands

- [x] 4.1 Replace init's skill/command generation path with the shared host generation pipeline
- [x] 4.2 Update `c3spec sync` to regenerate host outputs from `.agents/`
- [x] 4.3 Update `c3spec update` to refresh canonical artifacts and then regenerate host outputs
- [x] 4.4 Preserve remote skill fetch fallback behavior for canonical skills
- [x] 4.5 Add force/confirmation behavior for canonical edits and hand-edited generated files
- [x] 4.6 Update success output to summarize canonical artifacts and generated host artifacts instead of skills/commands

## 5. Dogfood and verify

- [x] 5.1 Regenerate this repository into the new canonical `.agents/` layout
- [x] 5.2 Ensure no `.cursor/skills/` mirror is generated
- [x] 5.3 Ensure `.claude/skills/` is generated from `.agents/skills/`
- [x] 5.4 Ensure `.codex/agents/*.toml` parses and config pins `max_depth = 1`
- [x] 5.5 Run focused generation tests
- [x] 5.6 Run `pnpm build`
- [x] 5.7 Run `pnpm test`
- [x] 5.8 Write verification and retrospective artifacts
