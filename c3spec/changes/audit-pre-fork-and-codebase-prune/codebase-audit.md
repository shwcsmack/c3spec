# Codebase Audit (Idea #2)

## Scope
Repo-wide pass across command surfaces, dependencies, schema/template bundles, and stale historical assets.

## Completed removals in this change
1. Removed legacy pre-fork and bootstrap-imported change folders under `c3spec/changes/` and `c3spec/changes/archive/`.
2. Removed `c3spec/changes/IMPLEMENTATION_ORDER.md` (legacy historical narrative tied to removed entries).
3. Updated stale CLI guidance to prefer verb-first surfaces:
   - `c3spec list --changes`
   - `c3spec show <id> --type change --json --deltas-only`

## Dependency audit results
- Runtime dependencies in `package.json` are all actively referenced in source or tests:
  - `@inquirer/core`, `@inquirer/prompts`, `chalk`, `commander`, `cross-spawn`, `fast-glob`, `ora`, `yaml`, `zod`
- No safe dependency removals identified in this pass.

## Command surface audit results
- Deprecated compatibility surfaces still exist and are exercised by tests/specs:
  - `c3spec experimental` alias
  - `c3spec change ...` and `c3spec spec ...` compatibility commands
- These are candidates for future removal only with an explicit deprecation-removal change and test/spec updates.

## Template/schema audit results
- Built-in schema bundles under `schemas/` and `c3spec/schemas/superpowers-bridge/` are still referenced by artifact-graph, schema commands, and tests.
- No schema bundle deletion executed in this pass.

## Deferred high-risk cleanup candidates
1. Remove deprecated alias commands (`experimental`, `change *`, `spec *`) after compatibility window decision.
2. Reconcile legacy `openspec` strings in long-tail specs/docs where behavior has fully moved to `c3spec` naming.
3. Evaluate whether portions of `c3spec/schemas/superpowers-bridge/` can be folded into canonical skill templates.

## Recommendation
Treat this change as the history-prune + low-risk command-guidance cleanup slice of idea #2, then open one follow-up change dedicated to deprecated command removal and compatibility test/spec migration.
