# Verification

## Commands

- `pnpm install`
  - Passed. Postinstall build completed successfully.
- `pnpm test`
  - Baseline before implementation passed.
- `node build.js`
  - Passed after each implementation stage.
- `pnpm test -- init update command-generation available-tools tool-detection`
  - Passed after Stage 1.
- `pnpm test -- host-generation`
  - Passed after Stages 2 and 3.
- `pnpm test -- update available-tools init sync host-generation`
  - Passed after Stage 4 host-detection fixes.
- `node bin/c3spec.js init --tools all --force .`
  - Passed for dogfood generation. Generated canonical `.agents/`, Cursor agents/hooks, Claude skills/agents/settings, and Codex agents/config/hooks.
- `TMPDIR=/tmp pnpm build && TMPDIR=/tmp pnpm test`
  - Passed. `81` test files and `1438` tests passed.
- `node bin/c3spec.js validate first-class-agent-hosts --type change --no-interactive`
  - Passed. Change is valid.

## Layout Checks

- `.agents/skills/` exists and is the canonical skill source.
- `.cursor/skills/` was removed; Cursor gets `.cursor/agents/` and `.cursor/hooks.json`.
- `.claude/skills/` is generated from `.agents/skills/`.
- `.codex/agents/*.toml` exists and `.codex/config.toml` includes `max_depth = 1`.
- Generated JSON host configs stay schema-clean; c3spec drift metadata is stored in sidecar `.c3spec.json` files.

## Residual Risks

- Existing workspace-local skill generation still uses canonical `.agents/skills/` for Codex workspace skills. Tests were updated to lock this behavior, but workspace host generation is not the main focus of this change.
- Drift handling uses safe skip-unless-`--force`; interactive confirmation can be added later if needed.
