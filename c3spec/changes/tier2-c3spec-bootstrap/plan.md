# Plan: c3spec-bootstrap

## Stage 1 — Parallel-safe (no inter-dependencies)

### Task 1.1: Rename package identity — `package.json`
Update `package.json`:
- `name`: `@shwcsmack/c3spec`
- `bin`: remove `openspec` key, add `c3spec: ./bin/c3spec.js`
- `description`: `Code 3 Dev spec-driven development CLI`
- `repository`: `https://github.com/shwcsmack/c3spec`
- Remove `posthog-node` from `dependencies`
- Set `"private": true`

No test for this task — verified by build succeeding and `c3spec --help` in Stage 4.

### Task 1.2: Rename binary file — `bin/openspec.js` → `bin/c3spec.js`
`git mv bin/openspec.js bin/c3spec.js`. The file content is `#!/usr/bin/env node\nimport '../dist/cli/index.js';` — no content changes needed, just the rename. Verify the bin path in package.json matches.

### Task 1.3: Replace telemetry with no-ops — `src/telemetry/`
Read `src/telemetry/index.ts` first to capture the exact exported function signatures. Replace the entire file with:
```ts
export async function maybeShowTelemetryNotice(): Promise<void> {}
export async function trackCommand(_command: string, _version: string): Promise<void> {}
export async function shutdown(): Promise<void> {}
export function isTelemetryEnabled(): boolean { return false; }
```
Check `src/telemetry/config.ts` — if it exists, replace with an empty stub that exports whatever types `index.ts` needs.
Do NOT touch `src/cli/index.ts` call sites — the no-ops preserve them.

### Task 1.4: Rename directory constant — `src/core/config.ts`
- `OPENSPEC_DIR_NAME` → `C3SPEC_DIR_NAME`, value `'c3spec'`
- `OPENSPEC_MARKERS` → `C3SPEC_MARKERS`
- Find all files that import `OPENSPEC_DIR_NAME` or `OPENSPEC_MARKERS` and update those import destructures. Use grep: `grep -rn "OPENSPEC_DIR_NAME\|OPENSPEC_MARKERS" src/`
- Do NOT yet update the hardcoded `'openspec'` string literals — that is Stage 2.

### Task 1.5: Update README — `README.md`
Rewrite `README.md`:
- Title: `c3spec`
- Tagline: `Code 3 Dev spec-driven development CLI`
- Install: `npm install -g git+https://github.com/shwcsmack/c3spec.git`
- Brief description of what it does (spec-driven workflow CLI, tiered routing, memory system)
- Remove all Fission AI / OpenSpec branding
- Keep LICENSE reference (MIT, forked from OpenSpec)

---

## Stage 2 — String sweep (parallel within stage; depends on 1.4 constant rename)

### Task 2.1: Replace `'openspec'` path strings — core files
Files: `src/core/list.ts`, `src/core/archive.ts`, `src/core/view.ts`, `src/core/specs-apply.ts`, `src/core/planning-home.ts`, `src/core/project-config.ts`

For each file:
1. Read the file
2. Replace every `path.join(..., 'openspec', ...)` → `path.join(..., 'c3spec', ...)`
3. Replace string literals in console messages: `openspec/` → `c3spec/`
4. Where the file already imports `OPENSPEC_DIR_NAME` from config, update to import `C3SPEC_DIR_NAME` and use that constant instead of the hardcoded string

### Task 2.2: Replace `'openspec'` path strings — artifact-graph and utils
Files: `src/core/artifact-graph/resolver.ts`, `src/core/artifact-graph/instruction-loader.ts`, `src/utils/change-utils.ts`
Same approach as 2.1.

### Task 2.3: Replace format/author/metadata identifiers
Files to update:
- `src/core/parsers/markdown-parser.ts`: `format: 'openspec'` → `format: 'c3spec'`
- `src/core/schemas/spec.schema.ts`: `z.literal('openspec')` → `z.literal('c3spec')`
- `src/core/templates/workflows/*.ts` (all files): `author: 'openspec'` → `author: 'c3spec'` in metadata objects
- `src/core/shared/skill-generation.ts`: author field → `'c3spec'`
- `src/core/global-config.ts`: `GLOBAL_CONFIG_DIR_NAME = 'openspec'` → `'c3spec'`, `GLOBAL_DATA_DIR_NAME = 'openspec'` → `'c3spec'`

### Task 2.4: Update legacy cleanup patterns — `src/core/legacy-cleanup.ts`
Read the file. For every pattern referencing `openspec`:
- Directory paths like `.claude/commands/openspec` → `.claude/commands/c3spec`
- File patterns like `openspec-*.md` → `c3spec-*.md`
- Apply consistently across all AI tool entries in the file

### Task 2.5: Update CLI program name — `src/cli/index.ts`
- `program.name('openspec')` → `program.name('c3spec')`
- Update the description string to `'Code 3 Dev spec-driven development CLI'`
- Find and remove the `maybeShowTelemetryNotice()` call from the `preAction` hook — just remove the line, the no-op export means it's also harmless if left, but remove it for clarity
- Any `version` or branding strings referencing openspec → c3spec

---

## Stage 3 — New features (sequential; depends on Stage 2)

### Task 3.1: Update init defaults + strip consent prompt — `src/core/init.ts`
- Change `const DEFAULT_SCHEMA = 'spec-driven'` → `'superpowers-bridge'`
- Search for telemetry consent prompt code (likely a `console.log` block about telemetry or a call to `maybeShowTelemetryNotice`) and remove it from the init flow
- Add `await scaffoldC3specStructure(path.join(projectPath, C3SPEC_DIR_NAME), projectPath)` call near the end of `run()`, after the config.yaml write block
- Import `scaffoldC3specStructure` from wherever Task 3.2 puts it

### Task 3.2: Implement `scaffoldC3specStructure` — new file `src/core/c3spec-scaffold.ts`
Create this file. The function receives `(c3specDir: string, projectRoot: string)`.

Steps (all writes check existence first — never overwrite):
1. Create `c3spec/memory/` subdirectories: `bug-patterns/`, `workflow/`, `constraints/`, `design-decisions/`
2. Write `c3spec/memory/MEMORY.md` with the standard index template (category sections, one-line-per-entry format)
3. Locate the bundled skills source. Skills live in the package at `schemas/superpowers-bridge/skills/` relative to the package root. Copy four skill directories to `.cursor/skills/`: `openspec-start/`, `openspec-tier1-fix/`, `openspec-tier2-feature/`, `openspec-subagent-dev/`
4. Read `schemas/superpowers-bridge/templates/adopters/CLAUDE.md.fragment.md`. If `CLAUDE.md` exists in projectRoot, append the fragment (with a separator comment). If not, create it with the fragment content.

Note: the bundled skills need to exist in `schemas/superpowers-bridge/skills/` — copy them there from `.cursor/skills/` as source files as part of this task.

### Task 3.3: Implement `c3spec memory` command — `src/commands/memory.ts`
Create `src/commands/memory.ts`. Export a `registerMemoryCommand(program: Command)` function.

**`memory list`**: 
- Find `c3spec/memory/MEMORY.md`, print it with chalk formatting. If not found, print helpful error.

**`memory add <category> <slug>`**:
- Validate category: `bug-patterns | workflow | constraints | design-decisions`
- Target path: `c3spec/memory/<category>/<slug>.md`
- If file exists, error: already exists
- Write frontmatter template:
  ```
  ---
  name: <slug>
  description: TODO — one-line summary
  metadata:
    type: <category>
  ---
  
  TODO — memory body
  ```
- Append to MEMORY.md under the correct `## <Category>` section: `- [<slug>](<category>/<slug>.md) — TODO`
- Print the file path so the user can open it

**`memory promote <slug>`**:
- Search `c3spec/changes/archive/*/retrospective.md` for lines matching `- [ ]` containing the slug string
- If memory file `c3spec/memory/*/<slug>.md` does not exist: error with clear message "Memory file not found — run \`c3spec memory add <category> <slug>\` first"
- If found: replace `- [ ]` → `- [x]` in the retro file, print which file was updated

Register in `src/cli/index.ts`: import `registerMemoryCommand` and call it with `program`.

---

## Stage 4 — Tests and verify (depends on all above)

### Task 4.1: Update test suite — `test/`
- `grep -rn "openspec" test/` to find all occurrences
- Replace binary name references `openspec` → `c3spec`
- Replace directory path assertions `'openspec'` → `'c3spec'`
- Replace format string assertions `'openspec'` → `'c3spec'`
- Update any snapshot files

### Task 4.2: Final verification
Run in sequence:
1. `grep -rn "openspec" src/` — must return zero results (if any remain, fix before proceeding)
2. `pnpm build` — must succeed with zero TypeScript errors
3. `pnpm test` — must pass
4. `node bin/c3spec.js --version` — prints version
5. `node bin/c3spec.js --help` — output contains `c3spec`, not `openspec`
6. `node bin/c3spec.js memory --help` — shows list/add/promote subcommands
