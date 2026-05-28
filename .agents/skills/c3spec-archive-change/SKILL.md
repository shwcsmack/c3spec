---
name: c3spec-archive-change
description: Archive a completed change in the experimental workflow. Use when the user wants to finalize and archive a change after implementation is complete.
license: MIT
compatibility: Requires c3spec CLI.
metadata:
  author: "c3spec"
  version: "1.0"
  generatedBy: "source"
---

Archive a completed change in the experimental workflow.

**Lifecycle contract:** This skill follows `c3spec-tier-lifecycle`. Consult that skill (Section 6 — Archive readiness) for tier-specific required artifacts and backwards-compatible handling rules before performing the archive.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `c3spec list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show only active changes (not already archived).
   Include the schema used for each change if available.

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Tier lifecycle readiness check (pre-archive)**

   Before performing the archive, consult `c3spec-tier-lifecycle` (Section 6 — Archive readiness) and apply it to the selected change. Run this check BEFORE the artifact/task/spec-sync checks below so that missing tier artifacts are surfaced first.

   a. **Locate `tier.md`** at `<changeRoot>/tier.md` (derive `changeRoot` from `c3spec status --change "<name>" --json`).

   b. **If `tier.md` exists:**
      - Read `Tier:` (`1`, `2`, or `3`) and `Status:` from the metadata block.
      - Verify every tier-specific required artifact from `c3spec-tier-lifecycle` Section 2 is present on disk:
        - **T1** (`c3spec/changes/tier1-<slug>/`): `tier.md`, `mini-plan.md`, `spec-impact.html`, `spec-impact.md`, `micro-retro.html`, `micro-retro.md`
        - **T2** (`c3spec/changes/tier2-<slug>/`): `tier.md`, `proposal.md`, `tasks.md`, `plan.md`, `verify.md`, `retrospective.md`
        - **T3** (`c3spec/changes/<slug>/`): `tier.md`, `brainstorm.md`, `proposal.md`, `design.md`, every `specs/<capability>/spec.md` delta listed in `tier.md` Affected Specs, `tasks.md`, `plan.md`, `verify.md`, `retrospective.md`
      - Verify the required artifacts checklist in `tier.md` is fully `- [x]`.
      - Verify `Status` is `ready-to-archive` (set after retrospective and any memory capture decision per the lifecycle contract).
      - Verify tier-specific task progress is complete:
        - **T1:** every checkbox in `mini-plan.md` (and any mirrored `tier.md` progress checklist) is `- [x]`.
        - **T2/T3:** every checkbox in `tasks.md` is `- [x]`.
      - **If any tier-required artifact is missing, the `tier.md` checklist still has `- [ ]` entries, `Status` is not `ready-to-archive`, or task progress is incomplete:**
        - Report each missing artifact, unchecked `tier.md` checkbox, and incomplete task-progress checkbox to the user.
        - STOP. Do NOT perform the archive. Route the user to `c3spec-continue-change` or the relevant tier skill (`c3spec-tier1-fix`, `c3spec-tier2-feature`, `c3spec-tier3-full`) to complete the gap.

   c. **If `tier.md` is absent** (legacy / pre-fork change):
      - Apply backwards-compatible handling per `c3spec-tier-lifecycle` Section 6: surface an explicit warning that lifecycle metadata is missing and that tier-specific readiness cannot be verified.
      - Use **AskUserQuestion tool** to confirm the user wants to proceed without tier metadata.
      - Do NOT retroactively require `tier.md` to be created for legacy/pre-fork changes in this pass.
      - If the user confirms, continue with the remaining steps. If not, STOP.

3. **Check artifact completion status**

   Run `c3spec status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:
   - `schemaName`: The workflow being used
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context
   - `artifacts`: List of artifacts with their status (`done` or other)

   If status reports `actionContext.mode: "workspace-planning"`, explain that workspace archive is not supported in this slice and STOP. Do not move workspace changes into repo-local archives or edit linked repos.

   **If any artifacts are not `done`:**
   - Display warning listing incomplete artifacts
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

4. **Check task completion status**

   Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found and `tier.md` exists:**
   - Treat this as a tier readiness failure that should have blocked in Step 2.
   - STOP and route the user to `c3spec-continue-change` or the relevant tier skill. Do not allow confirm-and-proceed for tier-aware incomplete task progress.

   **If incomplete tasks found and `tier.md` is absent (legacy/pre-fork):**
   - Display warning showing count of incomplete tasks
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

   **If no tasks file exists:** Proceed without task-related warning.

5. **Assess delta spec sync state**

   Use `artifactPaths.specs.existingOutputPaths` from status JSON to check for delta specs. If none exist, proceed without sync prompt.

   **If delta specs exist:**
   - Compare each delta spec with its corresponding main spec at `c3spec/specs/<capability>/spec.md`
   - Determine what changes would be applied (adds, modifications, removals, renames)
   - Show a combined summary before prompting

   **Prompt options:**
   - If changes needed: "Sync now (recommended)", "Archive without syncing"
   - If already synced: "Archive now", "Sync anyway", "Cancel"

   If user chooses sync, use Task tool (subagent_type: "general-purpose", prompt: "Use Skill tool to invoke c3spec-sync-specs for change '<name>'. Delta spec analysis: <include the analyzed delta spec summary>"). Proceed to archive regardless of choice.

6. **Perform the archive**

   Create an `archive` directory under `planningHome.changesDir` if it doesn't exist:
   ```bash
   mkdir -p "<planningHome.changesDir>/archive"
   ```

   Generate target name using current date: `YYYY-MM-DD-<change-name>`

   **Check if target already exists:**
   - If yes: Fail with error, suggest renaming existing archive or using different date
   - If no: Move `changeRoot` to the archive directory

   ```bash
   mv "<changeRoot>" "<planningHome.changesDir>/archive/YYYY-MM-DD-<name>"
   ```

7. **Automatically finish the development branch**

   Immediately after a successful archive, run:

   ```bash
   c3spec-finishing-development-branch
   ```

   This is the default endgame behavior. If finishing fails, keep archive marked complete and report actionable recovery steps.

8. **Display summary**

   Show archive + finish summary including:
   - Change name
   - Schema that was used
   - Archive location
   - Whether specs were synced (if applicable)
   - Finish-branch status (success/failure + recovery guidance if failed)
   - Note about any warnings (incomplete artifacts/tasks)

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/YYYY-MM-DD-<name>/
**Specs:** ✓ Synced to main specs (or "No delta specs" or "Sync skipped")
**Finish branch:** ✓ `c3spec-finishing-development-branch` ran (or "failed — see recovery guidance")

All artifacts complete. All tasks complete.
```

**Guardrails**
- Always prompt for change selection if not provided
- Always run the tier lifecycle readiness check from `c3spec-tier-lifecycle` Section 6 before performing the archive
- When `tier.md` exists, BLOCK archive on missing tier-required artifacts, an incomplete `tier.md` checklist, non-`ready-to-archive` status, or incomplete T1 mini-plan / T2/T3 task progress; report the gaps and route to the appropriate tier skill or `c3spec-continue-change`
- When `tier.md` is absent, treat the change as legacy/pre-fork: warn explicitly and require user confirmation, but do not retroactively require lifecycle metadata in this pass
- Use artifact graph (c3spec status --json) for completion checking on top of (not in place of) the tier readiness check
- Don't block archive on non-tier warnings for legacy/pre-fork changes (incomplete legacy artifacts, incomplete legacy tasks file) - just inform and confirm
- Preserve .c3spec.yaml when moving to archive (it moves with the directory)
- Show clear summary of what happened, including branch-finishing outcome
- If sync is requested, use c3spec-sync-specs approach (agent-driven)
- If delta specs exist, always run the sync assessment and show the combined summary before prompting
