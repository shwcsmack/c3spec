---
name: c3spec-using-git-worktrees
description: Local c3spec replacement for superpowers:using-git-worktrees. Create or validate an isolated branch workspace and baseline readiness before implementation.
---

# c3spec Using Git Worktrees

1. Ensure clean tracked state in source repo:
   - `git status --porcelain --untracked-files=no`
2. Ensure target branch exists and is checked out as instructed by caller.
3. Validate baseline in workspace:
   - install deps if needed
   - run project baseline tests/validation command
4. Report workspace path, branch, and baseline result.

If baseline fails, stop and ask whether to fix baseline first or continue with explicit acceptance.
