## Why

The project relies on `@fission-ai/openspec` — a generic third-party tool with telemetry we don't control, a binary name that carries no brand identity, and an `init` command that scaffolds a generic structure instead of the opinionated Code 3 Dev workflow. The workflow redesign (tiered routing, custom subagent orchestration, memory system) is complete. The next step is owning the full stack — CLI, schema, and eventually the plugin — so future projects can be bootstrapped from a single `c3spec init` instead of manually copying files.

## What Changes

**Package Identity**
- From: `@fission-ai/openspec`, binary `openspec`, public npm
- To: `@shwcsmack/c3spec`, binary `c3spec`, private (GitHub install)
- Reason: Brand ownership, no external dependency for the workflow tooling
- Impact: Non-breaking for this repo; breaking for any other consumer (none currently)

**Workflow Directory**
- From: `openspec/` (hardcoded constant in CLI source)
- To: `c3spec/`
- Reason: Consistency between tool name and managed directory
- Impact: Cross-cutting — touches every path the CLI resolves internally

**Telemetry**
- From: PostHog integration tracking every command via `posthog-node`
- To: Removed entirely (no-op stubs preserve import surface)
- Reason: No external data collection on private tooling
- Impact: Non-breaking

**Init Command**
- From: Generic `spec-driven` schema scaffold
- To: `superpowers-bridge` schema as default; scaffolds `c3spec/memory/`, tiered routing skills, CLAUDE.md fragment
- Reason: `c3spec init` should bootstrap the full Code 3 Dev workflow in one command
- Impact: Additive — new default profile, existing `spec-driven` profile still available

**New `c3spec memory` Subcommand**
- From: Memory system is manual markdown file editing
- To: `c3spec memory list`, `c3spec memory add <category> <slug>`, `c3spec memory promote <slug>`
- Reason: Reduces friction for memory capture during retrospectives
- Impact: Additive new command

## Capabilities

### New Capabilities
- `memory-management`: `c3spec memory` subcommand for listing, adding, and promoting project memory entries in `c3spec/memory/`

### Modified Capabilities
- `cli-init`: Default profile changed to scaffold full c3spec workflow structure (superpowers-bridge schema, memory directory, tiered routing skills, CLAUDE.md fragment)

## Impact

- `package.json` — name, bin key, description, remove `posthog-node`
- `bin/openspec.js` → `bin/c3spec.js` — rename + update target
- `src/core/config.ts` (or equivalent) — `"openspec"` directory constant → `"c3spec"`
- `src/telemetry/` — replace PostHog integration with no-op stubs
- `src/cli/index.ts` — program name, description, remove telemetry hooks
- `src/commands/memory.ts` (new) — memory subcommand implementation
- `src/core/init.ts` — add c3spec default profile with full scaffold
- `README.md` — rewrite for c3spec branding
- All tests — update binary name references
