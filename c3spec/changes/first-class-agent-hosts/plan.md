# First-Class Agent Hosts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use the project-local `c3spec-subagent-dev` skill to implement this plan stage-by-stage. Steps use checkbox (`- [ ]`) syntax for tracking. Ask for commit approval before execution begins. Do not mark tasks complete until implementation and both review passes are complete.

**Goal:** Rebuild c3spec around first-class Cursor, Claude Code, and Codex support using canonical `.agents/` artifacts and generated host-native outputs.

**Architecture:** `.agents/` becomes the canonical source for c3spec skills, subagent role manifests, and hook sources. A shared host-generation pipeline validates canonical inputs and renders native artifacts for Cursor, Claude Code, and Codex. Init, sync, and update all call that shared pipeline with drift protection.

**Tech Stack:** TypeScript strict ESM, Node.js >= 20.19.0, `yaml` for YAML parsing, existing test stack with Vitest, cross-platform paths via `path.join()` / `path.resolve()`.

---

## File Map

**Likely new files:**

- `src/core/host-generation/types.ts` — host generation contracts and canonical artifact types
- `src/core/host-generation/canonical.ts` — canonical `.agents/` discovery, validation, and bundled defaults
- `src/core/host-generation/sentinel.ts` — generated-file sentinel/hash helpers
- `src/core/host-generation/renderers/cursor.ts` — Cursor host renderer
- `src/core/host-generation/renderers/claude.ts` — Claude Code host renderer
- `src/core/host-generation/renderers/codex.ts` — Codex host renderer
- `src/core/host-generation/index.ts` — public generation pipeline
- `test/core/host-generation/*.test.ts` — unit and snapshot tests
- `.agents/skills/c3spec-start/SKILL.md`
- `.agents/skills/c3spec-tier1-fix/SKILL.md`
- `.agents/skills/c3spec-tier2-feature/SKILL.md`
- `.agents/skills/c3spec-subagent-dev/SKILL.md`
- `.agents/skills/c3spec-host-adapter/SKILL.md`
- `.agents/agents/implementer.yaml`
- `.agents/agents/spec-reviewer.yaml`
- `.agents/agents/quality-reviewer.yaml`
- `.agents/hooks/memory-scan.js`
- `.agents/hooks/session-start.yaml`

**Likely modified files:**

- `src/core/config.ts` — trim `AI_TOOLS`
- `src/core/init.ts` — replace skill/command generation with host generation
- `src/core/update.ts` — refresh canonical artifacts and derived outputs
- `src/core/c3spec-scaffold.ts` — route workflow scaffolding through canonical host generation
- `src/core/shared/tool-detection.ts` — detect canonical `.agents/` and supported host artifacts
- `src/core/shared/skill-generation.ts` — either retire old workflow list or adapt to canonical skill set
- `src/core/command-generation/*` — remove or narrow old slash-command adapter model
- `src/core/available-tools.ts`, `src/core/profile-sync-drift.ts`, `src/core/migration.ts`, `src/core/legacy-cleanup.ts` — update references to removed tools and slash-command artifacts
- `test/**` — update snapshots, tool list expectations, init/update behavior, and adapter tests
- docs/spec files as needed

---

## Stage 1: Remove unsupported host surface

### Task 1.1: Trim the supported host list

**Files:**

- Modify: `src/core/config.ts`
- Test: existing tests that assert available tools or init selections

- [ ] **Step 1: Update `AI_TOOLS`**

Replace the tool array with exactly:

```ts
export const AI_TOOLS: AIToolOption[] = [
  { name: 'Claude Code', value: 'claude', available: true, successLabel: 'Claude Code', skillsDir: '.claude' },
  { name: 'Codex', value: 'codex', available: true, successLabel: 'Codex', skillsDir: '.agents' },
  { name: 'Cursor', value: 'cursor', available: true, successLabel: 'Cursor', skillsDir: '.agents' },
];
```

Use `.agents` for Cursor and Codex only as the canonical skill discovery marker; host renderers will still generate `.cursor/` and `.codex/` native artifacts.

- [ ] **Step 2: Run focused tests or TypeScript compile**

Run:

```bash
node build.js
```

Expected: stale references to removed tools surface as compile errors. Fix only references that belong to the host/tool surface.

### Task 1.2: Delete removed command adapters and exports

**Files:**

- Delete: `src/core/command-generation/adapters/<removed-host>.ts`
- Modify: `src/core/command-generation/adapters/index.ts`
- Modify: command adapter registry/factory files under `src/core/command-generation/`
- Test: command-generation tests

- [ ] **Step 1: Delete every adapter except `cursor.ts`, `claude.ts`, and `codex.ts`**

Remove the adapter files for the unsupported hosts. Keep only files needed temporarily while Stage 3 replaces command-generation with host-generation.

- [ ] **Step 2: Remove stale exports/imports**

Update adapter index files and registry construction so no deleted adapter is referenced.

- [ ] **Step 3: Remove command generation tests for deleted hosts**

Delete or rewrite tests that assert paths/frontmatter for removed hosts. Add or adjust tests asserting unsupported hosts are rejected.

### Task 1.3: Update tool discovery and selection expectations

**Files:**

- Modify: `src/core/available-tools.ts`
- Modify: `src/core/shared/tool-detection.ts`
- Modify: tests covering `--tools all`, invalid tool IDs, and configured tool detection

- [ ] **Step 1: Ensure `--tools all` resolves to the three hosts**

Expected selected IDs:

```ts
['claude', 'codex', 'cursor']
```

Keep the order deterministic and match the displayed prompt order.

- [ ] **Step 2: Update invalid-tool errors**

Invalid tool errors should list only:

```text
all, none, claude, codex, cursor
```

### Task 1.4: Verify Stage 1

- [ ] **Step 1: Run build**

```bash
node build.js
```

Expected: TypeScript passes.

- [ ] **Step 2: Run focused tests**

Use existing test names after inspecting the suite, likely:

```bash
pnpm test -- init update command-generation available-tools
```

Expected: focused tests pass or only fail on behavior intentionally replaced in later stages.

---

## Stage 2: Add canonical `.agents/` model

### Task 2.1: Define canonical artifact types and validation

**Files:**

- Create: `src/core/host-generation/types.ts`
- Create: `src/core/host-generation/canonical.ts`
- Test: `test/core/host-generation/canonical.test.ts`

- [ ] **Step 1: Define canonical types**

Create types along these lines:

```ts
export interface CanonicalSkill {
  name: string;
  description: string;
  directoryName: string;
  body: string;
  sourcePath: string;
}

export interface CanonicalAgentManifest {
  name: string;
  description: string;
  instructions: string;
  model?: string;
  reasoningEffort?: 'low' | 'medium' | 'high';
  sandboxMode?: 'read-only' | 'workspace-write';
}

export interface CanonicalHookManifest {
  name: string;
  event: 'session-start';
  command: string;
  description: string;
}
```

Use exact field names discovered during implementation if local naming conventions suggest better names, but keep the boundary explicit.

- [ ] **Step 2: Add validation**

Validation should reject:

- missing skill frontmatter `name` or `description`
- agent manifests missing `name`, `description`, or `instructions`
- hook manifests missing `name`, `event`, or `command`
- unknown host IDs

- [ ] **Step 3: Add parser tests**

Test valid and invalid canonical skill, agent, and hook fixtures. Include multiline instructions.

### Task 2.2: Add canonical skill content

**Files:**

- Create: `.agents/skills/c3spec-start/SKILL.md`
- Create: `.agents/skills/c3spec-tier1-fix/SKILL.md`
- Create: `.agents/skills/c3spec-tier2-feature/SKILL.md`
- Create: `.agents/skills/c3spec-subagent-dev/SKILL.md`
- Create: `.agents/skills/c3spec-host-adapter/SKILL.md`

- [ ] **Step 1: Move existing tier skills into `.agents/skills/`**

Use current `.cursor/skills/` content as the starting point for:

- `c3spec-start`
- `c3spec-tier1-fix`
- `c3spec-tier2-feature`
- `c3spec-subagent-dev`

- [ ] **Step 2: Normalize subagent wording**

Replace host-specific language such as "use Task tool" with role-based language:

```text
Dispatch the implementer agent...
Dispatch the spec-reviewer agent...
Dispatch the quality-reviewer agent...
Consult c3spec-host-adapter for host-specific invocation details.
```

- [ ] **Step 3: Add `c3spec-host-adapter`**

The host adapter skill should explain:

- Cursor: dispatch named agents via Cursor subagent mechanism
- Claude Code: dispatch named agents via Claude subagent mechanism
- Codex: dispatch named custom agents from `.codex/agents/<name>.toml`
- unsupported host: stop and report unsupported host

Do not overfit host detection yet; the design intentionally leaves exact detection for implementation.

### Task 2.3: Add canonical agent manifests

**Files:**

- Create: `.agents/agents/implementer.yaml`
- Create: `.agents/agents/spec-reviewer.yaml`
- Create: `.agents/agents/quality-reviewer.yaml`

- [ ] **Step 1: Define `implementer`**

The implementer should:

- receive one bounded task
- make the smallest implementation that satisfies the task
- avoid marking task checkboxes
- return changed files, verification, and risks

- [ ] **Step 2: Define `spec-reviewer`**

The spec reviewer should:

- compare implementation against the relevant proposal/design/spec/tasks
- identify missing requirements or scope drift
- return pass/fail with concrete file references
- avoid style-only feedback

- [ ] **Step 3: Define `quality-reviewer`**

The quality reviewer should:

- review correctness, maintainability, tests, edge cases, and generated artifact drift
- return pass/fail with concrete fixes
- avoid expanding scope

### Task 2.4: Add canonical memory hook source

**Files:**

- Create: `.agents/hooks/memory-scan.js`
- Create: `.agents/hooks/session-start.yaml`

- [ ] **Step 1: Use Node for portability**

Prefer a Node script over shell-specific scripts so generated hooks work on macOS, Linux, and Windows.

The script should locate `c3spec/memory/MEMORY.md` relative to the current working directory or nearest project root and print a concise message plus the memory index content if present.

- [ ] **Step 2: Add hook manifest**

The manifest should describe the canonical event:

```yaml
name: c3spec-memory-scan
event: session-start
command: node .agents/hooks/memory-scan.js
description: Load the c3spec memory index at session start.
```

### Task 2.5: Verify Stage 2

Run:

```bash
pnpm test -- host-generation
node build.js
```

Expected: canonical parsers pass and build succeeds.

---

## Stage 3: Build host renderers

### Task 3.1: Implement host generation contract

**Files:**

- Create: `src/core/host-generation/index.ts`
- Create: `src/core/host-generation/renderers/cursor.ts`
- Create: `src/core/host-generation/renderers/claude.ts`
- Create: `src/core/host-generation/renderers/codex.ts`
- Test: `test/core/host-generation/renderers.test.ts`

- [ ] **Step 1: Define renderer inputs and outputs**

Renderer output should be file-oriented:

```ts
export interface GeneratedHostFile {
  path: string;
  content: string;
  source: string;
  generated: true;
}

export interface HostRenderer {
  hostId: 'cursor' | 'claude' | 'codex';
  render(input: CanonicalHostArtifacts): GeneratedHostFile[];
}
```

- [ ] **Step 2: Add registry lookup**

Registry should return renderers only for the three supported hosts.

### Task 3.2: Render Cursor artifacts

**Files:**

- Modify/Create: `src/core/host-generation/renderers/cursor.ts`
- Test: cursor renderer snapshot tests

- [ ] **Step 1: Render agents**

Each canonical agent renders to:

```text
.cursor/agents/<name>.md
```

Use markdown with YAML frontmatter compatible with Cursor subagents:

```markdown
---
name: spec-reviewer
description: Reviews c3spec task implementations against approved proposal, design, specs, and tasks.
readonly: true
---

<instructions>
```

- [ ] **Step 2: Render hooks**

Render `.cursor/hooks.json` with Cursor-compatible event naming for session start. Preserve or merge existing unmanaged content only if current hook utilities already support that pattern; otherwise implement managed-block/sentinel behavior.

- [ ] **Step 3: Do not render `.cursor/skills/`**

Add an assertion in tests that Cursor generation does not include `.cursor/skills/`.

### Task 3.3: Render Claude Code artifacts

**Files:**

- Modify/Create: `src/core/host-generation/renderers/claude.ts`
- Test: Claude renderer snapshot tests

- [ ] **Step 1: Render skill mirror**

Render each canonical skill to:

```text
.claude/skills/<skill-name>/SKILL.md
```

Include a generated sentinel indicating the source `.agents/skills/<skill-name>/SKILL.md`.

- [ ] **Step 2: Render agents**

Render each canonical agent to:

```text
.claude/agents/<name>.md
```

Use Claude-compatible markdown frontmatter:

```markdown
---
name: spec-reviewer
description: Reviews c3spec task implementations against approved proposal, design, specs, and tasks.
---

<instructions>
```

- [ ] **Step 3: Render settings/hooks and CLAUDE.md**

Render or merge `.claude/settings.json` with a session-start hook. Render `CLAUDE.md` so it imports or mirrors canonical `AGENTS.md` guidance without overwriting unrelated user content.

### Task 3.4: Render Codex artifacts

**Files:**

- Modify/Create: `src/core/host-generation/renderers/codex.ts`
- Test: Codex renderer snapshot and TOML parse tests

- [ ] **Step 1: Render Codex custom agents**

Render each canonical agent to:

```text
.codex/agents/<name>.toml
```

Required TOML fields:

```toml
name = "spec-reviewer"
description = "Reviews c3spec task implementations against approved proposal, design, specs, and tasks."
developer_instructions = """
<instructions>
"""
```

Use a TOML-safe writer. If no TOML serializer is already available for writing, add a tiny writer with tests for quotes, backslashes, and triple-quote edge cases.

- [ ] **Step 2: Render Codex config**

Render or merge `.codex/config.toml` with:

```toml
[agents]
max_threads = 6
max_depth = 1
```

- [ ] **Step 3: Render Codex hooks and AGENTS.md**

Render `.codex/hooks.json` with Codex-compatible event naming. Render root `AGENTS.md` with c3spec routing and memory scan guidance.

### Task 3.5: Add sentinel/hash support

**Files:**

- Create: `src/core/host-generation/sentinel.ts`
- Test: `test/core/host-generation/sentinel.test.ts`

- [ ] **Step 1: Define sentinel format**

Use a format that works in markdown, JSON, and TOML without breaking parsers. If one universal inline format is awkward, use per-file-type sentinel comments and a common payload:

```text
c3spec-generated: true
c3spec-source: .agents/...
c3spec-hash: <sha256>
```

- [ ] **Step 2: Implement stale-edit detection**

Expose:

```ts
isGeneratedByC3spec(content: string): boolean
hasGeneratedContentDrifted(content: string): boolean
withSentinel(content: string, source: string): string
```

Actual function names may differ, but tests must cover unchanged, hand-edited, and missing-sentinel cases.

### Task 3.6: Verify Stage 3

Run:

```bash
pnpm test -- host-generation
node build.js
```

Expected: renderer snapshots pass, generated TOML/JSON/frontmatter parse, and build succeeds.

---

## Stage 4: Wire `init`, `sync`, and `update`

### Task 4.1: Replace init's old generation path

**Files:**

- Modify: `src/core/init.ts`
- Modify: related init tests

- [ ] **Step 1: Call shared host generation**

Replace `generateSkillsAndCommands()` usage with the new host generation pipeline.

Inputs:

- project root
- selected host IDs
- force flag
- canonical artifact source

- [ ] **Step 2: Update success output**

Output should summarize:

- canonical artifacts created/refreshed
- host artifacts generated for Cursor/Claude/Codex
- skipped/unchanged generated files
- hand-edit warnings if any

Remove skills/commands count language.

### Task 4.2: Wire sync to canonical regeneration

**Files:**

- Modify: current sync command implementation after locating it
- Test: sync command tests

- [ ] **Step 1: Locate current sync command**

Use repository search for `sync` command entry points and existing behavior.

- [ ] **Step 2: Re-render host outputs from `.agents/`**

`c3spec sync` should not refresh bundled canonical content. It should read local `.agents/` and regenerate derived host artifacts.

- [ ] **Step 3: Add drift behavior**

If generated files were hand-edited, sync warns and skips unless forced or confirmed.

### Task 4.3: Wire update to canonical refresh

**Files:**

- Modify: `src/core/update.ts`
- Modify: update tests

- [ ] **Step 1: Fetch or load canonical skills**

Retain remote fetch fallback, but target canonical `.agents/skills/` content.

- [ ] **Step 2: Protect canonical user edits**

If local canonical artifacts differ from bundled/fetched source, require confirmation or `--force` before replacing them.

- [ ] **Step 3: Regenerate derived host outputs**

After canonical refresh, run host generation for configured hosts.

### Task 4.4: Verify Stage 4

Run:

```bash
pnpm test -- init update sync host-generation
node build.js
```

Expected: init/update/sync behavior passes and build succeeds.

---

## Stage 5: Dogfood and final verification

### Task 5.1: Regenerate this repo

**Files:**

- Create/modify: `.agents/**`
- Create/modify: `.claude/**`
- Create/modify: `.cursor/**`
- Create/modify: `.codex/**`
- Modify: root `AGENTS.md` and `CLAUDE.md` as needed

- [ ] **Step 1: Run local generation**

Use the built CLI or direct command after implementation:

```bash
node build.js
node bin/c3spec.js sync
```

Adjust the exact command if the implemented sync CLI differs.

- [ ] **Step 2: Inspect generated layout**

Confirm:

- `.agents/skills/` exists
- `.claude/skills/` exists
- `.cursor/skills/` does not exist unless pre-existing unmanaged files are intentionally left alone
- `.cursor/agents/` exists
- `.claude/agents/` exists
- `.codex/agents/` exists
- `.codex/config.toml` includes `max_depth = 1`

### Task 5.2: Run full verification

- [ ] **Step 1: Build**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 2: Test**

```bash
pnpm test
```

Expected: full suite passes.

- [ ] **Step 3: Inspect diff**

```bash
git status --short
git diff --stat
```

Expected: diff reflects planned adapter deletion, host generation code, canonical artifacts, generated host files, and updated tests/docs only.

### Task 5.3: Write verify and retrospective

**Files:**

- Create: `c3spec/changes/first-class-agent-hosts/verify.md`
- Create: `c3spec/changes/first-class-agent-hosts/retrospective.md`

- [ ] **Step 1: Write verification evidence**

Include exact commands, pass/fail status, and any known residual risks.

- [ ] **Step 2: Write retrospective**

Capture:

- decisions that mattered
- any implementation deviations
- future follow-ups, especially reintroducing other hosts or adding `.cursor/skills/` mirror if needed

---

## Self-Review

- Spec coverage: Plan covers supported-host removal, canonical `.agents/`, native subagent generation, hooks, init/sync/update wiring, drift protection, and dogfood verification.
- Placeholder scan: No implementation step relies on TODO/TBD placeholders. A few exact function names are intentionally allowed to vary during implementation, but each affected file and behavior is named.
- Type consistency: Canonical type names and host IDs are consistent across stages.

## Execution Handoff

Plan complete and saved to `c3spec/changes/first-class-agent-hosts/plan.md`.

Execution should use the project-local `c3spec-subagent-dev` workflow in a git worktree, with stage-based implementation and review gates. Ask for commit approval before dispatching implementation agents.
