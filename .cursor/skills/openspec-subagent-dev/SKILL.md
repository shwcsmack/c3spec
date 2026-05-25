---
name: openspec-subagent-dev
description: Execute an implementation plan using staged parallel subagents with two-stage review per task. Project-local replacement for superpowers:subagent-driven-development. Use when executing Tier 1, 2, or 3 plans from /opsx:start.
---

# OpenSpec Subagent-Driven Development

Execute a plan by dispatching fresh subagents per task, with stage-based parallelism for independent task groups and two-stage review (spec compliance → code quality) per task.

## Key differences from superpowers:subagent-driven-development

1. **Stage-based parallelism** — plan declares parallel-safe stages; independent tasks dispatch simultaneously
2. **Memory context injection** — relevant c3spec/memory/ learnings loaded into each implementer prompt
3. **Tier-aware review** — Tier 1 skips final whole-implementation review; Tier 3 keeps it
4. **Checkbox discipline** — implementer never marks tasks.md; controller marks only after both reviews pass
5. **HTML file path rule** — any HTML artifact produced must print `file:///absolute/path` immediately

## Plan format

Plans must declare stage structure. The controller reads stages, not just tasks:

```markdown
## Stage 1 — Parallel-safe (independent files)
### Task 1.1: [name]
### Task 1.2: [name]
### Task 1.3: [name]

## Stage 2 — Sequential (depends on Stage 1)
### Task 2.1: [name]
### Task 2.2: [name]
```

Tasks within a stage may be dispatched simultaneously. Stages are always sequential (complete all tasks in Stage N before dispatching Stage N+1).

If the plan has no stage declarations (e.g. Tier 1 mini plans), treat all tasks as a single sequential stage.

## Memory context loading

Before dispatching any subagent, load `c3spec/memory/MEMORY.md`. Identify entries whose tags overlap with the files or domain being worked on. Include those entries' full content in the implementer prompt under "## Relevant Past Learnings".

```bash
cat c3spec/memory/MEMORY.md
# then fetch relevant files:
cat c3spec/memory/<category>/<slug>.md
```

## Process

```
Read plan → extract all stages and tasks → create TodoWrite

For each stage (sequential):
  Dispatch all implementer subagents in stage simultaneously (background tasks)
  Wait for all implementers in stage to complete
  For each completed implementation (sequential within stage):
    Dispatch spec compliance reviewer
    If issues → implementer fixes → re-review (loop)
    After spec ✅ → dispatch code quality reviewer
    If issues → implementer fixes → re-review (loop)
    After quality ✅ → mark task [x] in tasks.md (controller only)

After all stages complete:
  [Tier 3 only] Dispatch final code reviewer across whole implementation
  Proceed to verify / retro / archive per tier
```

## Dispatching implementer subagents

Use `./implementer-prompt.md` template. For parallel stage dispatch, launch each as a background Agent task. Wait for all before proceeding to review.

**Never** dispatch two implementers that touch the same file simultaneously. If a stage accidentally contains tasks with overlapping files, treat them as sequential within that stage.

## Dispatching reviewer subagents

Use `./spec-reviewer-prompt.md` and `./code-quality-reviewer-prompt.md`. These are always sequential per task (spec first, quality after spec passes).

**Optimization:** For Tier 2/3 tasks where spec compliance is very likely (simple mechanical tasks), you may dispatch spec and quality reviewers simultaneously and discard the quality result if spec fails. Only do this when the task is clearly mechanical — never for integration or multi-file tasks.

## Model selection

- Mechanical implementation (1-2 files, complete spec): fast model (haiku)
- Integration / multi-file coordination: standard model (sonnet)
- Architecture / judgment / debugging: most capable model (opus)
- Reviewers: standard model (sonnet) — they read and reason, not generate
- Final code reviewer (Tier 3): most capable model

## Implementer status handling

**DONE** → proceed to spec review
**DONE_WITH_CONCERNS** → read concerns; if correctness/scope issue address before review; if observation note and proceed
**NEEDS_CONTEXT** → provide context and re-dispatch same task
**BLOCKED** → assess: context problem → re-dispatch with more context; reasoning problem → re-dispatch with more capable model; task too large → break into pieces; plan wrong → escalate to human

## Checkbox discipline

The controller marks tasks.md checkboxes — never the implementer subagent. Mark `[ ]` → `[x]` only after both spec compliance ✅ and code quality ✅. If a task needs re-implementation, the checkbox stays `[ ]` throughout.

## HTML file path rule

If any subagent or the controller generates an HTML file, immediately print:
```
HTML artifact ready — paste into browser:
  file:///[absolute path to file]
```
This is mandatory. The user works exclusively from the command line.

## Tier-specific behavior

**Tier 1:**
- No stage declarations needed (mini plans are sequential by default)
- Skip final whole-implementation code review
- After all tasks: spec impact check, micro-retro, memory capture (see Tier 1 skill)

**Tier 2:**
- Stage declarations recommended for plans with 10+ tasks
- Skip final whole-implementation code review
- After all tasks: 5-check verify, lightweight retro, learning capture

**Tier 3:**
- Stage declarations required for plans with 15+ tasks
- Run final whole-implementation code review (most capable model)
- After all tasks: full verify.md, full retro with §6 → memory direct capture

## Red flags (never do)

- Dispatch two implementers that modify the same file simultaneously
- Let implementer mark tasks.md checkboxes
- Skip spec compliance review before code quality review
- Proceed past a reviewer finding issues without re-implementing and re-reviewing
- Produce an HTML file without printing its file:/// path
- Start implementation without loading c3spec/memory/MEMORY.md for context
