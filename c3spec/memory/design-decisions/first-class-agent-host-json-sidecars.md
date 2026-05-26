# First-Class Host JSON Sidecars

## Context

The first-class agent host work generates JSON files consumed directly by Cursor, Claude Code, and Codex, such as hook or settings files.

## Decision

Do not inject c3spec metadata into host-consumed JSON. Store generated-file metadata in sidecar files named `<host-file>.c3spec.json` instead.

## Why

Inline JSON metadata such as `_c3spec` is valid JSON but can still break hosts that validate config schemas strictly or reject unknown top-level keys. Sidecars keep host JSON schema-clean while preserving generated-file drift detection.

## Applies When

- Rendering `.cursor/hooks.json`
- Rendering `.claude/settings.json`
- Rendering `.codex/hooks.json`
- Adding future generated JSON host files

## Tags

host-generation, json, drift-detection, cursor, claude, codex
