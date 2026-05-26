## Context

`c3spec update` currently refreshes skills and slash commands by generating file content from TypeScript template functions compiled into the CLI binary. Skill content improvements require a full npm publish + user CLI upgrade cycle. Users who run `c3spec update` frequently will not receive updated skill content unless they also upgrade the CLI — a two-step process that is easy to miss.

Additionally, the TypeScript template functions and any manually-maintained skill files are likely already out of sync, indicating that the current architecture makes drift easy.

The goal is to make skill content updatable independently of the CLI binary by fetching from the GitHub repository at update time, while eliminating the drift problem through a codegen-based single source of truth.

## Goals / Non-Goals

**Goals:**
- Skill content in user projects updates to the latest version when they run `c3spec update`, even without upgrading the CLI binary
- Editing a `skills/<workflow>/SKILL.md` file is the one and only way to change skill content — TypeScript templates are derived automatically
- Drift between raw skill files and bundled templates is structurally impossible
- `c3spec update` remains fully functional with no network connection

**Non-Goals:**
- Fetching slash command (`.md` command file) content from GitHub — follow-on change
- Caching fetched content between runs
- Pinning fetched content to a specific CLI version tag
- Self-updating the CLI binary

## Decisions

### D1: Single source of truth for skill content

**Choice:** Raw markdown files at `skills/<workflow>/SKILL.md` in the repository root are the authoritative source. TypeScript template functions in `src/core/templates/workflows/*.ts` are generated artifacts — never edited directly.

**Reason:** Two copies of content with a CI check can still drift between commits and creates confusion about which file to edit. A codegen relationship makes drift structurally impossible: there is only one file to edit.

**Alternatives considered:**
- TypeScript as SSoT + CI enforcement: still two copies, CI only catches drift at PR time not during editing
- Fetch-only with no bundled fallback: breaks offline use

### D2: Fetch from `main`, not a version tag

**Choice:** Fetch from `raw.githubusercontent.com/shwcsmack/c3spec/main/skills/<dir>/SKILL.md`.

**Reason:** Decoupling skill delivery from CLI releases is the core goal. Fetching from a version tag would preserve the current tight coupling — users on an old CLI would get the same old skills.

**Alternatives considered:**
- Version tag (e.g., `v1.3.1`): skill improvements still require CLI upgrade, defeats the purpose

### D3: Silent fallback to bundled on fetch failure

**Choice:** If any skill fetch fails (network error, timeout, non-2xx), fall back to the bundled TypeScript template for that skill. Log a single dim warning. Do not abort the update.

**Reason:** `c3spec update` is a user-initiated command that must work offline and on unreliable connections. A hard failure would break a workflow over a transient network issue.

**Alternatives considered:**
- Hard fail on network error: poor UX, breaks CI environments without outbound network
- Partial update (write fetched, skip failed): inconsistent state between skills

### D4: Always fetch fresh, no cache

**Choice:** Every `c3spec update` invocation fetches from GitHub.

**Reason:** `c3spec update` is an intentional user action, not a background daemon. The fetch is lightweight (small text files). Cache invalidation logic adds complexity with no meaningful benefit here.

### D5: SKILL.md format in the repository

**Choice:** Full frontmatter + body (same format written to user projects), with `generatedBy: "source"` as a placeholder. The CLI replaces `generatedBy` with the local installed version at write time.

**Reason:** Single format — the files in the repo are exactly what gets written to users, minus the version stamp. Makes the repo files human-readable and previewable without a build step.

**Alternatives considered:**
- Instructions-body-only files + separate metadata JSON: more files, more codegen complexity
- Full frontmatter including real version: `generatedBy` would reflect repo commit version, not user's CLI version

### D6: Codegen runs as part of `node build.js`

**Choice:** `build.js` runs `scripts/generate-templates.ts` (via `tsx` or compiled JS) before invoking `tsc`. CI adds a step that runs codegen and asserts `git diff --exit-code` on the generated TypeScript files.

**Reason:** Keeps the build a single command. Developers cannot forget to run codegen separately — it is always in the critical path.

**Alternatives considered:**
- Separate `pnpm codegen` step that developers must remember: easy to forget
- Pre-commit hook only: doesn't help CI or contributors without the hook

## Risks / Trade-offs

[Risk] GitHub raw content URL is unavailable or rate-limited → Mitigation: silent fallback to bundled ensures no user impact; rate limits on unauthenticated raw.githubusercontent.com are generous for this use pattern (small files, user-triggered).

[Risk] `main` branch has a broken or in-progress skill during an active edit → Mitigation: accept this risk; skills on `main` should always be in a working state by convention. Could mitigate later with a `stable` branch or tag, but adds process overhead not warranted now.

[Trade-off] Codegen adds a build step and a new script to maintain → Accepted: the alternative (manual sync) is already producing drift and will get worse.

[Trade-off] Users on an old CLI get `main` skills even if there are API-incompatible changes in newer skill content → Accepted for now: skill content is markdown instructions, not code with hard APIs. Incompatibility risk is low.

## Migration Plan

N/A — no database changes, no deployed service changes. The change is local to the CLI binary and the repository structure.

Rollout: publish a new npm version. Users get GitHub-fetched skills the next time they run `c3spec update`. Users who never upgrade continue with bundled templates from their installed version.

## Open Questions

None — all design decisions resolved during brainstorming.
