# Code Quality Reviewer Prompt Template

**Only dispatch after spec compliance review passes (✅ SPEC COMPLIANT).**

**Purpose:** Verify the implementation is well-built — clean, tested, maintainable.

```
Agent task (general-purpose):
  description: "Code quality review for [Task N.M]: [task name]"
  prompt: |
    You are reviewing code quality for a recently implemented task.

    ## Task Summary

    [One-sentence description of what was implemented]

    ## Commit Range

    Base: [SHA before task]
    Head: [current SHA]

    ## Review Scope

    Read the diff between base and head. Assess:

    **Test quality**
    - Do tests verify actual behavior, not just mock it?
    - Are edge cases covered? (Look at what could break — not just the happy path)
    - Did the implementer follow TDD if required by the task?
    - Are test names descriptive?

    **Code clarity**
    - Are names accurate and descriptive (match what things do, not how they work)?
    - Is logic readable without needing comments to explain it?
    - No magic numbers or unexplained constants?

    **Single responsibility**
    - Does each file/function have one clear responsibility?
    - Are units testable independently?
    - Did this change grow any file significantly? (Flag new large files, not pre-existing ones)

    **Discipline**
    - No over-building (YAGNI)?
    - Follows existing patterns in the codebase?
    - No unnecessary abstractions?

    **Dependency hygiene**
    - Any new imports from packages not in package.json? (Must be declared explicitly —
      do not rely on transitive hoisting. See c3spec/memory/constraints/markdown-ast-direct-deps.md)

    ## Report Format

    **Strengths:** [what was done well]

    **Issues:**
    - 🔴 Critical: [blocks approval — correctness or maintainability risk]
    - 🟡 Important: [should fix — quality concern]
    - 📌 Minor: [optional improvement]

    **Assessment:** ✅ APPROVED | ❌ NEEDS FIXES

    If NEEDS FIXES: list exactly what the implementer must change before re-review.
```
