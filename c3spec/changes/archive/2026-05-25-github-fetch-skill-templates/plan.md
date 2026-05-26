# GitHub Fetch Skill Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `c3spec update` fetch skill content from the c3spec GitHub repository at runtime, with silent fallback to bundled templates, and eliminate drift by making raw `skills/<dir>/SKILL.md` files the single source of truth via codegen.

**Architecture:** Each workflow TypeScript file in `src/core/templates/workflows/` exports both a skill template function and a command template function. Codegen uses begin/end comment markers to replace only the skill template function while preserving the command template. A new `src/core/shared/remote-skill-fetch.ts` module handles parallel GitHub fetches with per-skill fallback. The `UpdateCommand` calls this before its tool loop, resolving each skill to either the fetched template or the bundled one.

**Tech Stack:** TypeScript, Node.js ESM, built-in `fetch` (Node ≥18), `yaml` package (already in deps), Vitest.

---

## File Map

**New files:**
- `skills/c3spec-explore/SKILL.md` (+ 10 more workflow dirs) — source of truth for skill content
- `scripts/generate-templates.js` — codegen: reads `skills/*/SKILL.md`, replaces marked sections in workflow TypeScript files
- `src/core/shared/remote-skill-fetch.ts` — parallel fetch with timeout and per-skill fallback
- `test/core/remote-skill-fetch.test.ts` — unit tests for fetch module

**Modified files:**
- `src/core/templates/workflows/*.ts` (all 11) — add `// BEGIN:GENERATED_SKILL` / `// END:GENERATED_SKILL` markers around each skill template function; skill content extracted to `skills/`
- `src/core/update.ts` — call `fetchRemoteSkillTemplates()` before tool loop; use fetched templates with fallback; show consolidated fallback warning
- `build.js` — run `node scripts/generate-templates.js` before `tsc`
- `package.json` — add `check:codegen` script

---

### Task 1: Create skills/ source files and add codegen markers

**Files:**
- Create: `skills/<11 workflow dirs>/SKILL.md`
- Modify: `src/core/templates/workflows/*.ts` (all 11)

- [ ] **Step 1: Create the skills/ directory tree**

```bash
mkdir -p skills/c3spec-explore skills/c3spec-new-change skills/c3spec-continue-change \
  skills/c3spec-apply-change skills/c3spec-ff-change skills/c3spec-sync-specs \
  skills/c3spec-archive-change skills/c3spec-bulk-archive-change \
  skills/c3spec-verify-change skills/c3spec-onboard skills/c3spec-propose
```

- [ ] **Step 2: For each workflow, create `skills/<dir>/SKILL.md`**

Extract the `instructions` string from the TypeScript template function (unescape backticks: `\`` → `` ` ``, unescape `\${` → `${`). Use the other fields from the template (`name`, `description`, `license`, `compatibility`, `metadata`) to build the frontmatter. Set `generatedBy: "source"` as placeholder.

Format:
```markdown
---
name: c3spec-explore
description: Enter explore mode - a thinking partner for exploring ideas...
license: MIT
compatibility: Requires c3spec CLI.
metadata:
  author: c3spec
  version: "1.0"
  generatedBy: "source"
---

Enter explore mode. Think deeply. Visualize freely...
```

Repeat for all 11 workflows. The instructions body should be identical to what the TypeScript template returns, with backslash-escapes removed.

- [ ] **Step 3: Add BEGIN/END markers to each workflow TypeScript file**

For each file in `src/core/templates/workflows/`, wrap the skill template function (and only that function) with markers:

```typescript
// BEGIN:GENERATED_SKILL — edit skills/c3spec-explore/SKILL.md instead, then run node build.js
export function getExploreSkillTemplate(): SkillTemplate {
  return {
    // ... existing content unchanged ...
  };
}
// END:GENERATED_SKILL
```

The command template function (e.g., `getOpsxExploreCommandTemplate`) stays outside the markers, untouched.

Do this for all 11 workflow files: `explore.ts`, `new-change.ts`, `continue-change.ts`, `apply-change.ts`, `ff-change.ts`, `sync-specs.ts`, `archive-change.ts`, `bulk-archive-change.ts`, `verify-change.ts`, `onboard.ts`, `propose.ts`.

- [ ] **Step 4: Build and verify no compile errors**

```bash
node build.js
```

Expected: `✅ Build completed successfully!`

- [ ] **Step 5: Commit**

```bash
git add skills/ src/core/templates/workflows/
git commit -m "feat: add skills/ source-of-truth directory and codegen markers"
```

---

### Task 2: Write the codegen script

**Files:**
- Create: `scripts/generate-templates.js`

- [ ] **Step 1: Create `scripts/generate-templates.js`**

```javascript
#!/usr/bin/env node
// Codegen: reads skills/<dir>/SKILL.md → replaces marked section in src/core/templates/workflows/*.ts
// Run: node scripts/generate-templates.js

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const WORKFLOW_MAP = [
  { dirName: 'c3spec-explore',             fnName: 'getExploreSkillTemplate',           file: 'explore.ts' },
  { dirName: 'c3spec-new-change',          fnName: 'getNewChangeSkillTemplate',          file: 'new-change.ts' },
  { dirName: 'c3spec-continue-change',     fnName: 'getContinueChangeSkillTemplate',     file: 'continue-change.ts' },
  { dirName: 'c3spec-apply-change',        fnName: 'getApplyChangeSkillTemplate',        file: 'apply-change.ts' },
  { dirName: 'c3spec-ff-change',           fnName: 'getFfChangeSkillTemplate',           file: 'ff-change.ts' },
  { dirName: 'c3spec-sync-specs',          fnName: 'getSyncSpecsSkillTemplate',          file: 'sync-specs.ts' },
  { dirName: 'c3spec-archive-change',      fnName: 'getArchiveChangeSkillTemplate',      file: 'archive-change.ts' },
  { dirName: 'c3spec-bulk-archive-change', fnName: 'getBulkArchiveChangeSkillTemplate',  file: 'bulk-archive-change.ts' },
  { dirName: 'c3spec-verify-change',       fnName: 'getVerifyChangeSkillTemplate',       file: 'verify-change.ts' },
  { dirName: 'c3spec-onboard',             fnName: 'getOnboardSkillTemplate',            file: 'onboard.ts' },
  { dirName: 'c3spec-propose',             fnName: 'getOpsxProposeSkillTemplate',        file: 'propose.ts' },
];

const BEGIN_MARKER = '// BEGIN:GENERATED_SKILL';
const END_MARKER = '// END:GENERATED_SKILL';

for (const { dirName, fnName, file } of WORKFLOW_MAP) {
  const skillFile = join(ROOT, 'skills', dirName, 'SKILL.md');
  const tsFile = join(ROOT, 'src', 'core', 'templates', 'workflows', file);

  const raw = readFileSync(skillFile, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`Invalid SKILL.md format: ${skillFile}`);

  const fm = parseYaml(match[1]);
  const instructions = match[2].trim()
    .replace(/\\/g, '\\\\')   // escape existing backslashes first
    .replace(/`/g, '\\`')     // escape backticks
    .replace(/\$\{/g, '\\${'); // escape template literal expressions

  const generatedFn = [
    `${BEGIN_MARKER} — edit skills/${dirName}/SKILL.md instead, then run node build.js`,
    `export function ${fnName}(): SkillTemplate {`,
    `  return {`,
    `    name: ${JSON.stringify(fm.name)},`,
    `    description: ${JSON.stringify(fm.description)},`,
    `    license: ${JSON.stringify(fm.license ?? 'MIT')},`,
    `    compatibility: ${JSON.stringify(fm.compatibility ?? 'Requires c3spec CLI.')},`,
    `    metadata: {`,
    `      author: ${JSON.stringify(fm.metadata?.author ?? 'c3spec')},`,
    `      version: ${JSON.stringify(String(fm.metadata?.version ?? '1.0'))},`,
    `    },`,
    `    instructions: \`${instructions}\`,`,
    `  };`,
    `}`,
    END_MARKER,
  ].join('\n');

  const existing = readFileSync(tsFile, 'utf8');
  const beginIdx = existing.indexOf(BEGIN_MARKER);
  const endIdx = existing.indexOf(END_MARKER);
  if (beginIdx === -1 || endIdx === -1) {
    throw new Error(`Markers not found in ${tsFile}. Add BEGIN:GENERATED_SKILL and END:GENERATED_SKILL.`);
  }

  const updated = existing.slice(0, beginIdx) + generatedFn + existing.slice(endIdx + END_MARKER.length);
  writeFileSync(tsFile, updated);
  console.log(`  ✓ ${file} ← skills/${dirName}/SKILL.md`);
}

console.log('Codegen complete.');
```

- [ ] **Step 2: Run the codegen script and verify it produces no errors**

```bash
node scripts/generate-templates.js
```

Expected output: 11 lines of `✓ <file> ← skills/<dir>/SKILL.md`, then `Codegen complete.`

- [ ] **Step 3: Verify the generated TypeScript compiles cleanly**

```bash
node build.js
```

Expected: `✅ Build completed successfully!`

- [ ] **Step 4: Verify generated content matches original (no drift)**

```bash
git diff src/core/templates/workflows/
```

Expected: no diff (the generated content should be identical to what was already in the files, since we extracted the content from those files in Task 1).

If there IS a diff, the `skills/` SKILL.md files need to be corrected — the TypeScript is the ground truth at this point.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-templates.js
git commit -m "feat: add codegen script for skill templates"
```

---

### Task 3: Integrate codegen into build pipeline

**Files:**
- Modify: `build.js`
- Modify: `package.json`

- [ ] **Step 1: Update `build.js` to run codegen before tsc**

In `build.js`, add the codegen step after cleaning dist and before the `runTsc()` calls:

```javascript
// Run codegen to regenerate TypeScript templates from skills/ markdown files
console.log('Running codegen...');
execFileSync(process.execPath, ['scripts/generate-templates.js'], { stdio: 'inherit' });
```

The full updated flow in `build.js` should be:
1. Clean dist
2. `console.log('Running codegen...')`
3. `execFileSync(process.execPath, ['scripts/generate-templates.js'], { stdio: 'inherit' })`
4. `console.log('Compiling TypeScript...')`
5. `runTsc(['--version'])`
6. `runTsc()`

- [ ] **Step 2: Add `check:codegen` npm script to `package.json`**

In the `"scripts"` section of `package.json`, add:

```json
"check:codegen": "node scripts/generate-templates.js && git diff --exit-code src/core/templates/workflows/"
```

- [ ] **Step 3: Run the full build to verify the integrated pipeline works**

```bash
node build.js
```

Expected: codegen runs first (11 ✓ lines), then TypeScript compiles, then `✅ Build completed successfully!`

- [ ] **Step 4: Run `check:codegen` to verify it passes**

```bash
pnpm check:codegen
```

Expected: codegen runs, `git diff --exit-code` finds no changes, exits 0.

- [ ] **Step 5: Commit**

```bash
git add build.js package.json
git commit -m "feat: run skill codegen as part of build pipeline"
```

---

### Task 4: Implement remote skill fetch module

**Files:**
- Create: `src/core/shared/remote-skill-fetch.ts`

- [ ] **Step 1: Write the failing test first**

Create `test/core/remote-skill-fetch.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchRemoteSkillTemplates } from '../../src/core/shared/remote-skill-fetch.js';

describe('fetchRemoteSkillTemplates', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('returns parsed SkillTemplate on successful fetch', async () => {
    const mockSkillMd = `---
name: c3spec-explore
description: Explore mode description.
license: MIT
compatibility: Requires c3spec CLI.
metadata:
  author: c3spec
  version: "1.0"
  generatedBy: "source"
---

Explore instructions here.
`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockSkillMd,
    }));

    const result = await fetchRemoteSkillTemplates(['c3spec-explore']);

    expect(result.failedDirNames).toEqual([]);
    const template = result.remoteTemplates.get('c3spec-explore');
    expect(template).toBeDefined();
    expect(template?.name).toBe('c3spec-explore');
    expect(template?.description).toBe('Explore mode description.');
    expect(template?.instructions).toBe('Explore instructions here.');
  });

  it('returns null entry on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    }));

    const result = await fetchRemoteSkillTemplates(['c3spec-explore']);

    expect(result.remoteTemplates.has('c3spec-explore')).toBe(false);
    expect(result.failedDirNames).toEqual(['c3spec-explore']);
  });

  it('returns null entry on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    const result = await fetchRemoteSkillTemplates(['c3spec-explore']);

    expect(result.remoteTemplates.has('c3spec-explore')).toBe(false);
    expect(result.failedDirNames).toEqual(['c3spec-explore']);
  });

  it('fetches multiple skills and handles partial failure', async () => {
    const mockSkillMd = `---
name: c3spec-explore
description: Explore mode.
license: MIT
compatibility: Requires c3spec CLI.
metadata:
  author: c3spec
  version: "1.0"
  generatedBy: "source"
---

Instructions.
`;
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => mockSkillMd })
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'error' })
    );

    const result = await fetchRemoteSkillTemplates(['c3spec-explore', 'c3spec-apply-change']);

    expect(result.remoteTemplates.has('c3spec-explore')).toBe(true);
    expect(result.remoteTemplates.has('c3spec-apply-change')).toBe(false);
    expect(result.failedDirNames).toEqual(['c3spec-apply-change']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test test/core/remote-skill-fetch.test.ts
```

Expected: FAIL — `remote-skill-fetch.ts` does not exist yet.

- [ ] **Step 3: Create `src/core/shared/remote-skill-fetch.ts`**

```typescript
import { parse as parseYaml } from 'yaml';
import type { SkillTemplate } from '../templates/types.js';

const FETCH_BASE_URL = 'https://raw.githubusercontent.com/shwcsmack/c3spec/main/skills';
const FETCH_TIMEOUT_MS = 5000;

export interface RemoteFetchResult {
  remoteTemplates: Map<string, SkillTemplate>;
  failedDirNames: string[];
}

function parseSkillMd(raw: string): SkillTemplate {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error('Invalid SKILL.md frontmatter format');
  const fm = parseYaml(match[1]) as Record<string, unknown>;
  const meta = fm.metadata as Record<string, string> | undefined;
  return {
    name: fm.name as string,
    description: fm.description as string,
    license: (fm.license as string | undefined) ?? 'MIT',
    compatibility: (fm.compatibility as string | undefined) ?? 'Requires c3spec CLI.',
    metadata: {
      author: meta?.author ?? 'c3spec',
      version: String(meta?.version ?? '1.0'),
    },
    instructions: (match[2] as string).trim(),
  };
}

export async function fetchRemoteSkillTemplates(
  dirNames: string[]
): Promise<RemoteFetchResult> {
  const results = await Promise.allSettled(
    dirNames.map(async (dirName) => {
      const url = `${FETCH_BASE_URL}/${dirName}/SKILL.md`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
        const text = await res.text();
        return { dirName, template: parseSkillMd(text) };
      } finally {
        clearTimeout(timer);
      }
    })
  );

  const remoteTemplates = new Map<string, SkillTemplate>();
  const failedDirNames: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      remoteTemplates.set(result.value.dirName, result.value.template);
    } else {
      failedDirNames.push(dirNames[i]);
    }
  }

  return { remoteTemplates, failedDirNames };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test test/core/remote-skill-fetch.test.ts
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/shared/remote-skill-fetch.ts test/core/remote-skill-fetch.test.ts
git commit -m "feat: add remote skill fetch module with parallel fetch and fallback"
```

---

### Task 5: Integrate remote fetch into UpdateCommand

**Files:**
- Modify: `src/core/update.ts`

- [ ] **Step 1: Add imports to `src/core/update.ts`**

At the top of `src/core/update.ts`, add the import for the new fetch module:

```typescript
import {
  fetchRemoteSkillTemplates,
  type RemoteFetchResult,
} from './shared/remote-skill-fetch.js';
```

- [ ] **Step 2: Fetch remote skill content before the tool update loop**

In `UpdateCommand.execute()`, find the existing step 9 comment (`// 9. Determine what to generate based on delivery`). After that block, add the remote fetch:

```typescript
// 9. Determine what to generate based on delivery
const skillTemplates = shouldGenerateSkills ? getSkillTemplates(desiredWorkflows) : [];
const commandContents = shouldGenerateCommands ? getCommandContents(desiredWorkflows) : [];

// 9a. Fetch remote skill content (falls back to bundled on any failure)
let remoteSkillMap = new Map<string, import('../templates/types.js').SkillTemplate>();
let fetchFailures: string[] = [];
if (shouldGenerateSkills && skillTemplates.length > 0) {
  const dirNames = skillTemplates.map((e) => e.dirName);
  const fetchResult = await fetchRemoteSkillTemplates(dirNames);
  remoteSkillMap = fetchResult.remoteTemplates;
  fetchFailures = fetchResult.failedDirNames;
}
```

- [ ] **Step 3: Use resolved template in the skill generation inner loop**

In the tool update loop (around line 194–203), find the `for (const { template, dirName } of skillTemplates)` block. Change it to prefer the remote template:

```typescript
if (shouldGenerateSkills) {
  for (const { template, dirName } of skillTemplates) {
    const skillDir = path.join(skillsDir, dirName);
    const skillFile = path.join(skillDir, 'SKILL.md');

    const resolvedTemplate = remoteSkillMap.get(dirName) ?? template;
    const transformer = (tool.value === 'opencode' || tool.value === 'pi') ? transformToHyphenCommands : undefined;
    const skillContent = generateSkillContent(resolvedTemplate, C3SPEC_VERSION, transformer);
    await FileSystemUtils.writeFile(skillFile, skillContent);
  }

  removedDeselectedSkillCount += await this.removeUnselectedSkillDirs(skillsDir, desiredWorkflows);
}
```

- [ ] **Step 4: Show consolidated fallback warning after the summary**

In `UpdateCommand.execute()`, after the existing summary block (around line 249–267), add the fallback warning before the onboarding message block:

```typescript
// Show fallback warning if any skills used bundled content
if (fetchFailures.length > 0) {
  console.log(chalk.dim(`Note: remote skill fetch unavailable — used bundled content for: ${fetchFailures.join(', ')}`));
}
```

- [ ] **Step 5: Build to verify no compile errors**

```bash
node build.js
```

Expected: `✅ Build completed successfully!`

- [ ] **Step 6: Run the existing update tests to check for regressions**

```bash
pnpm test test/core/update.test.ts
```

Expected: all existing tests pass. (The fetch is mocked at the `fetch` global level; existing tests don't call fetch so they're unaffected.)

- [ ] **Step 7: Commit**

```bash
git add src/core/update.ts
git commit -m "feat: use remote skill content in c3spec update with bundled fallback"
```

---

### Task 6: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

```bash
pnpm test
```

Expected: all tests pass, no regressions.

- [ ] **Step 2: Run `c3spec update` in a real test project and verify remote content is fetched**

```bash
# Create a temp project and init c3spec
mkdir /tmp/c3spec-test && cd /tmp/c3spec-test
node /path/to/c3spec/dist/index.js init   # follow prompts, select Claude Code
node /path/to/c3spec/dist/index.js update
```

Expected: update runs, skill files are written, no fallback warning in output (assuming network is available).

Inspect a written SKILL.md to confirm `generatedBy` reflects the local CLI version, not `"source"`:

```bash
head -10 .cursor/skills/c3spec-explore/SKILL.md
```

Expected: `generatedBy: "1.3.1"` (or current version).

- [ ] **Step 3: Verify fallback behavior by pointing at an invalid host**

Temporarily modify `FETCH_BASE_URL` in `remote-skill-fetch.ts` to `https://invalid.example.invalid/skills`, rebuild, and run `c3spec update`:

```bash
# After modifying FETCH_BASE_URL:
node build.js
node dist/index.js update
```

Expected: update completes successfully, dim warning is shown listing all 11 (or profile-filtered) workflows as using bundled content.

Revert the URL change and rebuild when done.

- [ ] **Step 4: Run `pnpm check:codegen` to confirm no drift**

```bash
pnpm check:codegen
```

Expected: exits 0 with no git diff.

- [ ] **Step 5: Final commit if any loose ends**

```bash
git add -p  # stage any remaining changes
git commit -m "chore: verify and clean up github fetch skill templates"
```
