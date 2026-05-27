---
name: complete-excision-active-surfaces
description: Complete removal work must audit lockfiles and test-only environment variables, not just runtime code.
category: workflow
tags: [cleanup, telemetry, lockfiles, tests, excision, workflow-gates]
source-change: tier2-remove-upstream-telemetry
date: 2026-05-26
status: active
---

# Complete Excision Active Surfaces

## Context

While removing inherited upstream telemetry, the runtime module and CLI hooks were already obvious removal targets. A later reference audit found less obvious active surfaces: stale `C3SPEC_TELEMETRY` test environment variables and PostHog entries in `package-lock.json`.

## Learning

For removal work described as "complete excision," lockfiles and test environment variables count as active product surfaces even when the runtime implementation is already gone. Include them in the first audit pass instead of treating them as incidental cleanup.

## Applies When

- Removing an inherited capability entirely
- Cleaning telemetry, analytics, instrumentation, or other cross-cutting behavior
- Auditing whether a deleted dependency is fully gone
- Checking tests that set environment variables for removed behavior

## Guidance

Search active source, tests, live specs, docs, and all tracked lockfiles for removed capability names, dependency names, helper names, and related environment variables. Classify remaining matches explicitly as active, historical, backlog, or current-change planning context before marking the audit complete.
