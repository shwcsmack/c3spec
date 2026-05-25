<!-- Source: superpowers-bridge/templates/adopters/CLAUDE.md.fragment.md -->
<!-- Drop this section into your project's CLAUDE.md so Claude routes future work using this schema correctly. -->
<!-- Adjust the schema name and bridge repo URL if you customized them; otherwise keep as-is. -->

## Workflow routing (read on session start)

This repo uses [`superpowers-bridge`](https://github.com/JiangWay/openspec-schemas/tree/main/superpowers-bridge) to bridge OpenSpec and Superpowers. Integration rules (language, artifact paths, PRECHECK) follow that bridge's README; this section is the routing guidance for Claude.

### Step 0 — Memory scan (every session start)

Before any other action, run:

```bash
cat openspec/memory/MEMORY.md
```

Load relevant entries for the work about to begin. This prevents repeating known mistakes.

### Entry routing

**Single front door: `/opsx:start` always.**

Do not pick a tier yourself. `/opsx:start` interviews the user and routes to the correct tier.

| Trigger you observe | What to do |
|---|---|
| Any new work (bug fix, feature, refactor, investigation) | `/opsx:start` — let the interview classify the tier |
| User is mid-change, resuming | Advance with `openspec-subagent-dev` or the appropriate tier step |

### Tier classification (determined during `/opsx:start` interview)

| Tier | Name | When | Ceremony |
|---|---|---|---|
| T1 | Spec-Aware Fix | Bug fix, config tweak, investigation, no new capability | Inline mini plan → execute → spec impact report → micro-retro |
| T2 | Lightweight Feature | New capability, clear scope, 1-2 specs, limited design uncertainty | HTML proposal → (HTML design) → tasks → staged plan → execute → verify → retro |
| T3 | Full Workflow | Design uncertainty, architecture, breaking change, cross-system integration | Full superpowers-bridge artifact DAG: brainstorm → proposal → design → specs → tasks → plan → execute → verify → retro |

**Lean toward lighter tier** when ambiguous — it is always possible to escalate mid-change if complexity emerges.

### HTML artifact rule

Every HTML artifact generated **must** immediately print:

```
[Artifact name] ready — paste into browser:
  file:///[absolute path to artifact.html]
```

Do not proceed until the user has approved. Then save the markdown version.

### Apply step rules (all tiers)

- **Always** use a git worktree (`superpowers:using-git-worktrees`). Depth varies by tier.
- **Always** execute via `openspec-subagent-dev` (project-local skill in `.cursor/skills/openspec-subagent-dev/`).
- **Always** invoke `superpowers:finishing-a-development-branch` as the final step.
- **Always** ask for commit approval upfront before starting (once, not per commit).
- **Never** write inline code in plan.md — plans describe what, not how.

### Anti-patterns (don't do)

- Using `/opsx:new` or `/opsx:ff` directly — always `/opsx:start`
- Skipping the interview and picking a tier yourself
- Letting brainstorming write to `docs/superpowers/specs/`
- Skipping the memory scan at session start
- Proceeding past an HTML artifact without printing the `file:///` path and waiting for approval
- Marking tasks `[x]` before both spec reviewer and quality reviewer have approved
- Creating a T3 change directory for a bug fix

Full detail: [superpowers-bridge README §Entry & exit gates](https://github.com/JiangWay/openspec-schemas/blob/main/superpowers-bridge/README.md#entry--exit-gates).
