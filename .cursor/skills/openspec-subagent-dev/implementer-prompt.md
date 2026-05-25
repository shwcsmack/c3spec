# Implementer Subagent Prompt Template

Use this template when dispatching an implementer subagent. Fill in all bracketed sections before dispatching.

```
Agent task (general-purpose):
  description: "Implement [Task N.M]: [task name]"
  prompt: |
    You are implementing [Task N.M]: [task name]

    ## Task Description

    [FULL TEXT of task from plan — paste completely, do not make subagent read the file]

    ## Context

    [Scene-setting: where this task fits in the overall change, what stage it's in,
     which tasks preceded it, architectural context, key constraints]

    ## Relevant Past Learnings

    [Paste full content of any c3spec/memory/ entries whose tags match this task's
     domain. If none are relevant, write "None identified." Do not skip this section.]

    ## Working Directory

    [path — e.g. open-brain/]

    ## Before You Begin

    If you have questions about requirements, approach, dependencies, or anything unclear:
    **ask them now**, before starting work. It's always better to ask than to assume.

    If this is a bug fix task: write a failing test that reproduces the bug FIRST.
    That test is your acceptance criterion. Do not write production code until the
    test exists and fails for the right reason.

    ## Your Job

    1. Implement exactly what the task specifies — nothing more, nothing less
    2. Write tests following TDD (failing test first for bug fixes; test alongside for features)
    3. Verify implementation works (run the relevant test command)
    4. Commit your work with a clear commit message
    5. Self-review (see below)
    6. Report back

    **Do NOT modify tasks.md** — the controller marks task completion after review.

    **If you generate any HTML file**, immediately output:
    ```
    HTML artifact ready — paste into browser:
      file:///[absolute path]
    ```

    ## Code Organization

    - Follow the file structure defined in the plan
    - Each file should have one clear responsibility
    - Follow existing patterns in the codebase — don't restructure outside your task
    - If a file is growing beyond plan intent, report DONE_WITH_CONCERNS, don't split unilaterally

    ## When to Escalate

    Stop and report BLOCKED or NEEDS_CONTEXT when:
    - The task requires architectural decisions with multiple valid approaches
    - You've read multiple files without finding clarity
    - You feel uncertain whether your approach is correct
    - The task involves restructuring the plan didn't anticipate

    Bad work is worse than no work. Escalating is always correct.

    ## Self-Review (before reporting)

    **Completeness:** Did I implement everything? Miss any requirements? Handle edge cases?
    **Quality:** Clear names? Clean, maintainable code?
    **Discipline:** No overbuilding (YAGNI)? Followed existing patterns?
    **Testing:** Tests verify behavior (not just mock it)? TDD followed if required?
    **Past learnings:** Did I apply the relevant past learnings from the context above?

    Fix any self-review findings before reporting.

    ## Report Format

    - **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
    - What you implemented (or attempted if blocked)
    - Test results
    - Files changed (list each)
    - Self-review findings (if any)
    - Past learning application (which learnings influenced your approach, if any)
    - Any concerns
```
