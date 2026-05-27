---
name: c3spec-bulk-archive-change
description: Archive multiple completed changes at once. Use when archiving several parallel changes.
license: MIT
compatibility: Requires c3spec CLI.
metadata:
  author: "c3spec"
  version: "1.0"
  generatedBy: "source"
---

Archive multiple completed changes in a single operation.

This skill allows you to batch-archive changes, handling spec conflicts intelligently by checking the codebase to determine what's actually implemented.

**Lifecycle contract:** This skill follows `c3spec-tier-lifecycle`. Apply the archive readiness check (Section 6) to every selected change before archiving it. Treat tier-aware readiness as a per-change gate inside the batch — surface gaps for individual changes rather than failing the whole batch.

**Input**: None required (prompts for selection)

**Steps**

1. **Get active changes**

   Run `c3spec list --json` to get all active changes.

   If no active changes exist, inform user and stop.

2. **Prompt for change selection**

   Use **AskUserQuestion tool** with multi-select to let user choose changes:
   - Show each change with its schema
   - Include an option for "All changes"
   - Allow any number of selections (1+ works, 2+ is the typical use case)

   **IMPORTANT**: Do NOT auto-select. Always let the user choose.

3. **Batch validation - gather status for all selected changes**

   For each selected change, collect:

   a. **Artifact status** - Run `c3spec status --change "<name>" --json`
      - Parse `schemaName`, `artifacts`, `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`
      - Note which artifacts are `done` vs other states

      If any selected change reports `actionContext.mode: "workspace-planning"`, explain that workspace bulk archive is not supported in this slice and STOP before syncing specs or moving changes. Do not fall back to repo-local paths or edit linked repos.

   b. **Tier lifecycle readiness** - Consult `c3spec-tier-lifecycle` (Section 6) for each change:
      - Look for `<changeRoot>/tier.md`.
      - **If `tier.md` exists:**
        - Read `Tier:` and `Status:` from the metadata block.
        - Verify every tier-specific required artifact from `c3spec-tier-lifecycle` Section 2 is present on disk:
          - **T1** (`c3spec/changes/tier1-<slug>/`): `tier.md`, `mini-plan.md`, `spec-impact.html`, `spec-impact.md`, `micro-retro.html`, `micro-retro.md`
          - **T2** (`c3spec/changes/tier2-<slug>/`): `tier.md`, `proposal.md`, `tasks.md`, `plan.md`, `verify.md`, `retrospective.md`
          - **T3** (`c3spec/changes/<slug>/`): `tier.md`, `brainstorm.md`, `proposal.md`, `design.md`, every `specs/<capability>/spec.md` delta listed in `tier.md` Affected Specs, `tasks.md`, `plan.md`, `verify.md`, `retrospective.md`
        - Verify the required artifacts checklist in `tier.md` is fully `- [x]`.
        - Verify `Status` is `ready-to-archive`.
        - Verify tier-specific task progress is complete:
          - **T1:** every checkbox in `mini-plan.md` (and any mirrored `tier.md` progress checklist) is `- [x]`.
          - **T2/T3:** every checkbox in `tasks.md` is `- [x]`.
        - Record any missing artifacts, unchecked checklist entries, non-`ready-to-archive` status, or incomplete task progress as a per-change readiness gap. Do NOT archive a tier change with unresolved readiness gaps in this batch.
      - **If `tier.md` is absent** (legacy / pre-fork change):
        - Record an explicit "legacy: no tier.md" warning for this change.
        - Apply backwards-compatible handling — the user MAY still confirm archive for legacy changes in Step 7, but the warning must be visible in the per-change status table.

   c. **Task completion** - Read `artifactPaths.tasks.existingOutputPaths` from status JSON
      - Count `- [ ]` (incomplete) vs `- [x]` (complete)
      - If no tasks file exists, note as "No tasks"
      - If `tier.md` exists, task completion is already part of the tier readiness gate from Step 3b; incomplete progress keeps the change `Blocked`, not `Warn`.

   d. **Delta specs** - Check `artifactPaths.specs.existingOutputPaths` from status JSON
      - List which capability specs exist
      - For each, extract requirement names (lines matching `### Requirement: <name>`)

4. **Detect spec conflicts**

   Build a map of `capability -> [changes that touch it]`:

   ```
   auth -> [change-a, change-b]  <- CONFLICT (2+ changes)
   api  -> [change-c]            <- OK (only 1 change)
   ```

   A conflict exists when 2+ selected changes have delta specs for the same capability.

5. **Resolve conflicts agentically**

   **For each conflict**, investigate the codebase:

   a. **Read the delta specs** from each conflicting change to understand what each claims to add/modify

   b. **Search the codebase** for implementation evidence:
      - Look for code implementing requirements from each delta spec
      - Check for related files, functions, or tests

   c. **Determine resolution**:
      - If only one change is actually implemented -> sync that one's specs
      - If both implemented -> apply in chronological order (older first, newer overwrites)
      - If neither implemented -> skip spec sync, warn user

   d. **Record resolution** for each conflict:
      - Which change's specs to apply
      - In what order (if both)
      - Rationale (what was found in codebase)

6. **Show consolidated status table**

   Display a table summarizing all changes, including the tier readiness column from Step 3b:

   ```
   | Change              | Tier | Tier Ready    | Artifacts | Tasks | Specs   | Conflicts | Status  |
   |---------------------|------|---------------|-----------|-------|---------|-----------|---------|
   | schema-management   | T3   | Ready         | Done      | 5/5   | 2 delta | None      | Ready   |
   | project-config      | T2   | Ready         | Done      | 3/3   | 1 delta | None      | Ready   |
   | add-oauth           | T2   | Ready         | Done      | 4/4   | 1 delta | auth (!)  | Ready*  |
   | add-verify-skill    | T2   | Missing retro | 1 left    | 2/5   | None    | None      | Blocked |
   | old-pre-fork-change | —    | Legacy (warn) | Done      | 4/4   | None    | None      | Warn    |
   ```

   - `Tier`: `T1`/`T2`/`T3` when `tier.md` exists, `—` when absent.
   - `Tier Ready`: `Ready` when all tier-required artifacts are present, the `tier.md` checklist is fully `- [x]`, tier-specific task progress is complete, and `Status` is `ready-to-archive`. Otherwise show a short reason such as `Missing retro`, `tier.md not [x]`, `tasks incomplete`, or `Status=verifying`. For legacy/pre-fork changes without `tier.md`, show `Legacy (warn)`.
   - `Status`: `Blocked` whenever `Tier Ready` is anything other than `Ready` or `Legacy (warn)`. `Warn` for legacy/pre-fork changes that lack tier metadata but otherwise pass artifact/task checks. `Ready` only when tier readiness and artifact/task checks all pass.

   For conflicts, show the resolution:
   ```
   * Conflict resolution:
     - auth spec: Will apply add-oauth then add-jwt (both implemented, chronological order)
   ```

   For tier-blocked changes, list specific gaps:
   ```
   Tier readiness gaps:
   - add-verify-skill (T2): missing retrospective.md; tier.md "retrospective.md" still [ ]; Status=verifying
   ```

   For incomplete (non-tier) changes, show warnings:
   ```
   Warnings:
   - add-verify-skill: 1 incomplete artifact, 3 incomplete tasks
   - old-pre-fork-change: no tier.md (legacy/pre-fork, lifecycle metadata not retroactively enforced)
   ```

7. **Confirm batch operation**

   Use **AskUserQuestion tool** with a single confirmation:

   - "Archive N changes?" with options based on status
   - Options might include:
     - "Archive all eligible changes (skip tier-blocked)"
     - "Archive only N ready changes (skip blocked and incomplete)"
     - "Cancel"

   **Per-change archive rules:**
   - **Blocked (tier readiness gap, `tier.md` present):** Do NOT include in the archive batch in this run. Route the user to `c3spec-continue-change` or the relevant tier skill (`c3spec-tier1-fix`, `c3spec-tier2-feature`, `c3spec-tier3-full`) to complete the gap, then re-run bulk archive.
   - **Warn (legacy/pre-fork, no `tier.md`):** Allowed to archive if the user explicitly confirms in this step; do not auto-include without confirmation.
   - **Ready:** Eligible to archive.

   If there are incomplete (non-tier) changes, make clear they'll be archived with warnings only when the user explicitly opts in.

8. **Execute archive for each confirmed change**

   Process changes in the determined order (respecting conflict resolution). Skip any change whose tier readiness from Step 3b is `Blocked`; only process `Ready` changes and `Warn` (legacy/pre-fork) changes the user explicitly confirmed.

   a. **Sync specs** if delta specs exist:
      - Use the c3spec-sync-specs approach (agent-driven intelligent merge)
      - For conflicts, apply in resolved order
      - Track if sync was done

   b. **Perform the archive**:
      ```bash
      mkdir -p "<planningHome.changesDir>/archive"
      mv "<changeRoot>" "<planningHome.changesDir>/archive/YYYY-MM-DD-<name>"
      ```

   c. **Track outcome** for each change:
      - Success: archived successfully
      - Failed: error during archive (record error)
      - Blocked: tier readiness gap (`tier.md` present, required artifacts/checklist/status incomplete); record the specific gap
      - Skipped: user chose not to archive (legacy/pre-fork warn, incomplete tasks, etc.)

9. **Display summary**

   Show final results:

   ```
   ## Bulk Archive Complete

   Archived 3 changes:
   - schema-management-cli -> archive/2026-01-19-schema-management-cli/
   - project-config -> archive/2026-01-19-project-config/
   - add-oauth -> archive/2026-01-19-add-oauth/

   Skipped 1 change:
   - add-verify-skill (user chose not to archive incomplete)

   Spec sync summary:
   - 4 delta specs synced to main specs
   - 1 conflict resolved (auth: applied both in chronological order)
   ```

   If any failures:
   ```
   Failed 1 change:
   - some-change: Archive directory already exists
   ```

**Conflict Resolution Examples**

Example 1: Only one implemented
```
Conflict: specs/auth/spec.md touched by [add-oauth, add-jwt]

Checking add-oauth:
- Delta adds "OAuth Provider Integration" requirement
- Searching codebase... found src/auth/oauth.ts implementing OAuth flow

Checking add-jwt:
- Delta adds "JWT Token Handling" requirement
- Searching codebase... no JWT implementation found

Resolution: Only add-oauth is implemented. Will sync add-oauth specs only.
```

Example 2: Both implemented
```
Conflict: specs/api/spec.md touched by [add-rest-api, add-graphql]

Checking add-rest-api (created 2026-01-10):
- Delta adds "REST Endpoints" requirement
- Searching codebase... found src/api/rest.ts

Checking add-graphql (created 2026-01-15):
- Delta adds "GraphQL Schema" requirement
- Searching codebase... found src/api/graphql.ts

Resolution: Both implemented. Will apply add-rest-api specs first,
then add-graphql specs (chronological order, newer takes precedence).
```

**Output On Success**

```
## Bulk Archive Complete

Archived N changes:
- <change-1> -> archive/YYYY-MM-DD-<change-1>/
- <change-2> -> archive/YYYY-MM-DD-<change-2>/

Spec sync summary:
- N delta specs synced to main specs
- No conflicts (or: M conflicts resolved)
```

**Output On Partial Success**

```
## Bulk Archive Complete (partial)

Archived N changes:
- <change-1> -> archive/YYYY-MM-DD-<change-1>/

Blocked M changes (tier readiness gap — run c3spec-continue-change or the tier skill):
- <change-2> (T2): missing retrospective.md; tier.md "retrospective.md" still [ ]

Skipped K changes:
- <change-3> (user chose not to archive incomplete)

Failed L changes:
- <change-4>: Archive directory already exists
```

**Output When No Changes**

```
## No Changes to Archive

No active changes found. Create a new change to get started.
```

**Guardrails**
- Allow any number of changes (1+ is fine, 2+ is the typical use case)
- Always prompt for selection, never auto-select
- Always apply the `c3spec-tier-lifecycle` Section 6 archive readiness check to every selected change before archiving it
- BLOCK archive for any change where `tier.md` exists but tier-required artifacts are missing, the `tier.md` checklist is not fully `- [x]`, tier-specific task progress is incomplete, or `Status` is not `ready-to-archive`. Surface gaps per change and continue with the rest of the batch.
- For legacy/pre-fork changes without `tier.md`, surface an explicit warning but allow archive when the user confirms in the batch confirmation step. Do not retroactively require lifecycle metadata in this pass.
- Detect spec conflicts early and resolve by checking codebase
- When both changes are implemented, apply specs in chronological order
- Skip spec sync only when implementation is missing (warn user)
- Show clear per-change status before confirming, including tier readiness
- Use single confirmation for entire batch
- Track and report all outcomes (success/skip/blocked/fail)
- Preserve .c3spec.yaml when moving to archive
- Archive directory target uses current date: YYYY-MM-DD-<name>
- If archive target exists, fail that change but continue with others
