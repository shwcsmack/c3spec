## Context

Forking `@fission-ai/openspec` → `c3spec`. Source inspection revealed: `OPENSPEC_DIR_NAME = 'openspec'` constant in `src/core/config.ts` is the intended central constant, but ~15 files hardcode `'openspec'` as a path string directly. Telemetry is a full PostHog integration with consent flow. No existing `memory` command. Init has a profile system (`'core' | 'custom'`) that controls which workflow commands are installed — not the right abstraction for memory/skills scaffolding.

**Zero tolerance for `openspec` strings**: `grep -rn "openspec" src/` must return zero results after this change.

## Goals / Non-Goals

**Goals:**
- Rename every `openspec` reference in the source to `c3spec` — binary, package, directory constant, path strings, format identifiers, author fields, legacy cleanup patterns
- Strip PostHog telemetry with zero import-site breakage
- `c3spec init` scaffolds the full Code 3 Dev workflow (memory structure, tiered skills, CLAUDE.md) out of the box
- `c3spec memory` subcommand (list / add / promote) with enforce-on-promote invariant

**Non-Goals:**
- Extending the profile system
- Upstream OpenSpec feature parity
- Interactive memory management
- Plugin packaging (separate phase)

## Decisions

### D1: Directory rename strategy

- **Chosen**: Global find-replace + rename the constant. Change `OPENSPEC_DIR_NAME = 'openspec'` → `C3SPEC_DIR_NAME = 'c3spec'` in `config.ts`, then replace all ~15 hardcoded `'openspec'` path strings across the codebase. Also rename format identifiers (`format: 'openspec'` → `'c3spec'`), author fields, and legacy cleanup patterns.
- **Why**: The constant alone misses ~15 files that use string literals directly. Both steps are required. Post-change grep verifies completeness.
- **Alternatives considered**: Central constant only (misses hardcoded literals); runtime-configurable directory name (over-engineering for a clean-break fork).

### D2: Telemetry removal

- **Chosen**: Replace `src/telemetry/index.ts` with no-op stubs exporting the same function signatures (`maybeShowTelemetryNotice`, `trackCommand`, `shutdown`). Remove `posthog-node` from `package.json`. Strip the first-run consent prompt from `init.ts`.
- **Why**: No-ops preserve call sites in `cli/index.ts` untouched — zero risk of breaking the command lifecycle. Only three changes required.
- **Alternatives considered**: Full deletion (requires editing lifecycle hooks in cli/index.ts, higher breakage risk); replace with own PostHog project (no value for a private tool).

### D3: c3spec init scaffolding

- **Chosen**: Change `DEFAULT_SCHEMA = 'spec-driven'` → `'superpowers-bridge'` in `init.ts`. Add `scaffoldC3specStructure()` call at the end of `InitCommand.run()` that creates `c3spec/memory/` directories, writes `MEMORY.md` index, and copies tiered routing skills to `.cursor/skills/`. Idempotent — never overwrites existing files.
- **Why**: Memory structure and skills are not profile-configurable concepts — they're always part of c3spec. A post-scaffold step is the path of least resistance. No new abstractions.
- **Alternatives considered**: New `'c3spec'` profile value (wrong abstraction — profiles control workflow commands, not directory scaffolding); separate `c3spec scaffold` command (defeats the one-command bootstrap goal).

### D4: c3spec memory command

- **Chosen**: New `src/commands/memory.ts`, registered in `src/cli/index.ts`. Three subcommands:
  - `list` — reads `c3spec/memory/MEMORY.md`, prints grouped index with file sizes
  - `add <category> <slug>` — creates `c3spec/memory/<category>/<slug>.md` with frontmatter template and appends pointer to `MEMORY.md`
  - `promote <slug>` — finds retro files with `- [ ] ... <slug>`, verifies memory file exists, marks `- [x]`
- **Why**: `promote` solves the specific friction where retro §6 candidates get checked in markdown but the memory file never gets created. Makes promotion a one-liner and enforces the invariant.
- **Alternatives considered**: Interactive mode (deferred); JSON/YAML store (agents read markdown natively — wrong format).

## Risks / Trade-offs

- [Risk] Missed `openspec` path string after rename → Mitigation: `grep -rn "openspec" src/` must return zero results; run as part of verify step
- [Risk] `posthog-node` removal breaks build → Mitigation: no-op stubs export identical TypeScript signatures; compiler confirms
- [Risk] Init scaffold overwrites custom edits → Mitigation: `scaffoldC3specStructure()` checks file existence before writing, idempotent
- [Trade-off] `promote` uses exact slug string match — may miss retro candidates with slight wording variations → Accepted for v1; clear error message when no match found

## Migration Plan

N/A — this repo is a fresh fork with no existing users. All changes apply to source only.

## Open Questions

All resolved. `grep -rn "openspec" src/` = zero results is the acceptance criterion for the rename.
