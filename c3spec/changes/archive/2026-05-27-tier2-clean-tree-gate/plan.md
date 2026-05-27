# Plan: clean-tree-gate

## Stage 1 - Canonical Skill Updates

### Task 1.1: Add the front-door clean-tree gate
Update `.agents/skills/c3spec-start/SKILL.md` so the workflow starts by checking tracked uncommitted changes in the source repo before memory scan, interview, routing, or tier handoff. The gate should instruct agents to run `git status --porcelain --untracked-files=no`, ignore untracked files, and soft-block with stash/commit/abort options when output is non-empty.

### Task 1.2: Add the tier clean-tree gates
Update `.agents/skills/c3spec-tier1-fix/SKILL.md`, `.agents/skills/c3spec-tier2-feature/SKILL.md`, and `.agents/skills/c3spec-tier3-full/SKILL.md` with the same pre-flight gate before commit approval and worktree setup. Keep the wording consistent so direct tier entry behaves like the front door.

## Stage 2 - Generated Artifact Sync

### Task 2.1: Regenerate host-specific artifacts
Run the repo's established host-generation/update path so the generated Cursor, Claude, and Codex skill artifacts reflect the canonical `.agents/skills/` edits. Inspect the generated diff to ensure only expected files changed.

## Stage 3 - Verification

### Task 3.1: Verify workflow artifacts and tests
Confirm `tasks.md` reflects completed work, run the appropriate generated-artifact check, run the TypeScript/test baseline, and verify no unrelated files changed.
