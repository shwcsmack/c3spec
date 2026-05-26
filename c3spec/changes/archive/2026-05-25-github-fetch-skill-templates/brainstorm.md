# Brainstorm: GitHub Fetch for Skill Templates

## Background

Currently `c3spec update` refreshes skills and slash commands by writing content from TypeScript template functions bundled inside the installed CLI binary. This means:
- Skill improvements require a full npm publish + user CLI upgrade
- `c3spec update` is misleadingly named — it doesn't pull anything new unless the binary changed
- The TypeScript templates and any future raw skill files are suspected to be out of sync already

## Decision Chain

### Q1: Should fetch be the default or opt-in?

**Decision: default behavior** — the whole value prop is transparent delivery of skill improvements. An opt-in flag would mean most users never get it.

### Q2: Which version/ref to fetch from?

**Options considered:**
- `main` — always latest skills, even without CLI upgrade ✓
- version tag (e.g., `v1.3.1`) — ties skills to CLI version, loses the benefit

**Decision: `main`** — decoupling skill updates from CLI releases is the core goal.

### Q3: Should there be an offline fallback?

**Decision: yes, silent fallback to bundled** — `c3spec update` is a user-initiated command, not a background service. Network failure shouldn't break the workflow. Log a dim warning, write bundled content.

### Q4: Cache or always fetch fresh?

**Decision: always fresh** — `c3spec update` is an intentional action. No cache complexity needed.

### Q5: How to eliminate sync drift between raw files and TypeScript templates?

**Options considered:**
- TypeScript as SSoT + CI check (two copies, enforced equality) — drift is possible between commits
- Raw markdown as SSoT + codegen derives TypeScript — structurally impossible to drift ✓
- Fetch-only, no bundled templates — breaks offline use

**Decision: raw markdown as single source of truth.** `skills/<workflow>/SKILL.md` files are edited by hand. `scripts/generate-templates.ts` reads them and regenerates `src/core/templates/workflows/*.ts`. `build.js` runs codegen before `tsc`. CI asserts `git diff --exit-code` on generated files.

### Q6: What format do the raw SKILL.md files use?

**Decision: full frontmatter + body** (same format written to user projects), with `generatedBy: "source"` as a placeholder. The CLI replaces `generatedBy` with the local version at write time. This keeps a single format and makes the repo files human-readable/previewable.

## Design Trade-offs

| Concern | This approach | Alternative |
|---|---|---|
| Sync drift | Structurally impossible (codegen) | CI-only check (possible between commits) |
| Offline use | Bundled fallback | Hard fail (bad UX) |
| Skill velocity | Ship via git push | Ship via npm publish |
| Complexity | Codegen script + fetch layer | Simpler (no codegen) |

## Final Design

```
skills/
  c3spec-explore/SKILL.md          ← SSoT, edited by humans
  c3spec-apply-change/SKILL.md
  c3spec-new-change/SKILL.md
  ... (one per workflow)

scripts/generate-templates.ts       ← codegen reads skills/ → writes TypeScript
build.js                            ← runs codegen before tsc
src/core/templates/workflows/*.ts   ← GENERATED, never edited directly

c3spec update (fetch flow):
  1. Fetch each workflow's SKILL.md from raw.githubusercontent.com/shwcsmack/c3spec/main/skills/<dir>/SKILL.md in parallel
  2. 5s timeout per request
  3. Success → write with local generatedBy version
  4. Any failure → silent fallback to bundled, dim warning logged
```

**Out of scope:** command template (slash command) fetch — separate concern, follow-on change.
