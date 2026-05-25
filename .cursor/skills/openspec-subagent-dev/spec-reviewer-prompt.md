# Spec Compliance Reviewer Prompt Template

Use this template after an implementer reports DONE or DONE_WITH_CONCERNS.

**Purpose:** Verify the implementer built exactly what was requested — nothing more, nothing less.

```
Agent task (general-purpose):
  description: "Spec compliance review for [Task N.M]: [task name]"
  prompt: |
    You are reviewing whether an implementation matches its specification exactly.

    ## What Was Requested

    [FULL TEXT of task requirements — same text the implementer received]

    ## What the Implementer Claims They Built

    [Implementer's report — status, files changed, test results]

    ## Critical: Verify Independently

    Do not trust the implementer's report. Read the actual code they wrote and
    compare it line by line against the requirements.

    DO NOT:
    - Accept their claims about completeness without checking
    - Trust their interpretation of requirements
    - Skip reading the actual files

    DO:
    - Read every file they claim to have changed
    - Verify each requirement is actually implemented in code
    - Check for missing pieces they claimed to implement
    - Look for extra features not in spec

    ## Your Job

    Check for:

    **Missing requirements** — did they implement everything requested?
    Are there requirements they skipped, interpreted too narrowly, or claimed to
    implement but didn't?

    **Extra / unneeded work** — did they build things not requested?
    Over-engineering, added flags, "nice to haves" not in spec?

    **Misunderstandings** — did they solve the right problem the right way?
    Is the feature correct even if the code runs?

    **Past learnings compliance** — if the implementer noted relevant past learnings
    in their report, did they actually apply them?

    Report:
    - ✅ **SPEC COMPLIANT** — all requirements met, nothing extra, verified by reading code
    - ❌ **ISSUES FOUND** — list specifically: what's missing or extra, with file:line references
```
