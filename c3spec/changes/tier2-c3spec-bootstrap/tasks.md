# Tasks: c3spec-bootstrap

## Stage 1 — Parallel-safe (independent files)

- [ ] Task 1.1: Rename package identity — `package.json`
  - name: `@shwcsmack/c3spec`, bin key: `c3spec: ./bin/c3spec.js`, description, remove `posthog-node` from dependencies
  - Impact: none on source; binary name changes

- [ ] Task 1.2: Rename binary file — `bin/openspec.js` → `bin/c3spec.js`
  - Git mv the file; verify the shebang target and import path still resolve

- [ ] Task 1.3: Replace telemetry with no-ops — `src/telemetry/index.ts`
  - Replace entire file content with three async no-op exports: `maybeShowTelemetryNotice`, `trackCommand`, `shutdown`
  - Preserve TypeScript signatures exactly (same parameter names and types)
  - Also remove `telemetry/config.ts` PostHog config if it exists; replace with empty stub

- [ ] Task 1.4: Rename directory constant — `src/core/config.ts`
  - `OPENSPEC_DIR_NAME` → `C3SPEC_DIR_NAME = 'c3spec'`
  - Update all import sites that destructure `OPENSPEC_DIR_NAME` to use `C3SPEC_DIR_NAME`
  - Rename `OPENSPEC_MARKERS` → `C3SPEC_MARKERS`

- [ ] Task 1.5: Update README — `README.md`
  - Full rewrite: c3spec branding, Code 3 Dev attribution, install from GitHub instructions
  - Remove OpenSpec/Fission AI references

## Stage 2 — Directory path string rename (depends on 1.4)

- [ ] Task 2.1: Replace hardcoded `'openspec'` path strings — core files
  - Files: `src/core/list.ts`, `src/core/archive.ts`, `src/core/view.ts`, `src/core/specs-apply.ts`, `src/core/planning-home.ts`, `src/core/project-config.ts`
  - Replace `path.join(..., 'openspec', ...)` → `path.join(..., 'c3spec', ...)`
  - Replace string literals in console.log messages referencing `openspec/`
  - Update imports to use `C3SPEC_DIR_NAME` where the constant is available

- [ ] Task 2.2: Replace hardcoded `'openspec'` path strings — artifact-graph and utils
  - Files: `src/core/artifact-graph/resolver.ts`, `src/core/artifact-graph/instruction-loader.ts`, `src/utils/change-utils.ts`
  - Same pattern: path.join strings and any console messages

- [ ] Task 2.3: Replace format/author/metadata identifier strings
  - `src/core/parsers/markdown-parser.ts`: `format: 'openspec'` → `'c3spec'`
  - `src/core/schemas/spec.schema.ts`: `z.literal('openspec')` → `z.literal('c3spec')`
  - All `src/core/templates/workflows/*.ts`: `author: 'openspec'` → `'c3spec'`
  - `src/core/shared/skill-generation.ts`: author field
  - `src/core/global-config.ts`: `GLOBAL_CONFIG_DIR_NAME`, `GLOBAL_DATA_DIR_NAME` → `'c3spec'`

- [ ] Task 2.4: Update legacy cleanup patterns — `src/core/legacy-cleanup.ts`
  - Rename all `openspec-*.md` patterns → `c3spec-*.md`
  - Rename directory paths like `.claude/commands/openspec` → `.claude/commands/c3spec`
  - Rename `.cursor/commands/openspec-*.md` → `.cursor/commands/c3spec-*.md`
  - Update all other tool patterns consistently

- [ ] Task 2.5: Update CLI program name — `src/cli/index.ts`
  - `program.name('openspec')` → `program.name('c3spec')`
  - `program.description(...)` → Code 3 Dev description
  - Remove first-run telemetry consent prompt from the `preAction` hook
  - Strip the `version` reference from `package.json` if it reads `@fission-ai/openspec`

## Stage 3 — New features (depends on Stage 2 completing)

- [ ] Task 3.1: Update init command defaults — `src/core/init.ts`
  - `DEFAULT_SCHEMA = 'spec-driven'` → `'superpowers-bridge'`
  - Remove first-run telemetry consent prompt (strip `maybeShowTelemetryNotice` calls if present in init)
  - Add call to `scaffoldC3specStructure(openspecPath, projectPath)` at end of `run()` after config.yaml written

- [ ] Task 3.2: Implement `scaffoldC3specStructure` — `src/core/init.ts` (or `src/core/c3spec-scaffold.ts`)
  - Create `c3spec/memory/` directory and subdirectories: `bug-patterns/`, `workflow/`, `constraints/`, `design-decisions/`
  - Write `c3spec/memory/MEMORY.md` with section headers (only if not exists)
  - Copy skills from `schemas/superpowers-bridge/skills/` to `.cursor/skills/`: `openspec-start`, `openspec-tier1-fix`, `openspec-tier2-feature`, `openspec-subagent-dev`
  - Write CLAUDE.md routing block (append if CLAUDE.md exists, create if not) — use the fragment from `schemas/superpowers-bridge/templates/adopters/CLAUDE.md.fragment.md`
  - All writes are idempotent: skip if file already exists

- [ ] Task 3.3: Implement `c3spec memory` command — `src/commands/memory.ts`
  - Register as `program.command('memory')` in `src/cli/index.ts`
  - `list`: read `c3spec/memory/MEMORY.md`, print with category grouping and entry count
  - `add <category> <slug>`: validate category is one of `bug-patterns|workflow|constraints|design-decisions`, create the file with frontmatter template, append pointer line to MEMORY.md
  - `promote <slug>`: search `c3spec/changes/archive/*/retrospective.md` for `- [ ]` lines containing slug, verify `c3spec/memory/*/<slug>.md` exists, replace `- [ ]` → `- [x]`; exit with clear error if memory file not found

## Stage 4 — Tests and verify (depends on all above)

- [ ] Task 4.1: Update test references — `test/`
  - Replace binary name `openspec` → `c3spec` in all test files
  - Replace `'openspec'` directory strings in expected path assertions → `'c3spec'`
  - Update any snapshot files

- [ ] Task 4.2: Final grep verification
  - Run `grep -rn "openspec" src/` — must return zero results
  - Run `pnpm build` — must succeed with zero TypeScript errors
  - Run `pnpm test` — must pass
  - Run `node bin/c3spec.js --version` — must print version
  - Run `node bin/c3spec.js --help` — must show `c3spec` in output
