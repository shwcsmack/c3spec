---
name: fork-bootstrap-provenance-classification
description: For forked repos, classify legacy change content using pre-fork provenance and bootstrap-import commit boundaries, not path-local commit dates alone.
category: workflow
tags: [cleanup, provenance, fork, changes, archive, workflow-gates]
source-change: audit-pre-fork-and-codebase-prune
date: 2026-05-27
status: active
---

# Fork Bootstrap Provenance Classification

## Context
During pre-fork cleanup of `c3spec/changes/`, some folders appeared c3spec-era when checked only by path-local commit history because they were imported in the fork bootstrap commit.

## Learning
When classifying inherited change folders in a forked repository, use provenance rules that account for bootstrap-import commits and original pre-fork history. Path-local first-commit dates alone can misclassify imported legacy content as native.

## Applies When
- Auditing `changes/` and `changes/archive/` in a forked repository
- Pruning inherited upstream artifacts
- Building retention policies for historical change folders

## Guidance
1. Identify the fork/bootstrap import commit boundary.
2. Classify folders as legacy when their effective provenance predates the fork, even if they were reintroduced under a bootstrap commit.
3. Keep post-fork folders that originated after the fork boundary.
4. Validate retained and deleted sets with CLI listing and full tests before archive.
