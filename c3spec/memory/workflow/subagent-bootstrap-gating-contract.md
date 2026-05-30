# Subagent Bootstrap Gating Contract

## Context

When subagent dispatch prerequisites are validated ad hoc across multiple skills, failures happen late and remediation is inconsistent.

## Learning

Introduce an explicit bootstrap gate command with:
- required vs informational check categories,
- stable check IDs for automation,
- distinct exit-code classes by failure type,
- optional JSON output for machine consumption.

This pattern makes workflow gating deterministic, testable, and easier to integrate into dispatch orchestration.

## Tags

workflow-gates, subagents, bootstrap, exit-codes, json-contracts, reliability
