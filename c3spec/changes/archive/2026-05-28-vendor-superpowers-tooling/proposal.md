# Proposal: vendor-superpowers-tooling

## Why
c3spec currently depends on external `superpowers:*` skills for key workflow steps. This introduces availability and drift risk and limits c3spec-specific customization.

## What Changes
- Vendor local c3spec-owned replacements for critical superpowers dependencies.
- Replace canonical workflow references to use local skills.
- Add a dependency map (direct + nested) and a prioritized adoption list for remaining superpowers skills.

## New Capabilities
- Local ownership of critical path workflow skills.
- Explicit dependency and nested-skill visibility.
- Structured adoption roadmap for additional superpowers skills.

## Impact
- Affected specs: `canonical-skills`, `workflow-routing`
- Affected canonical skills: tier workflows and archive flow
- Affected tests: skill generation/lifecycle routing expectations