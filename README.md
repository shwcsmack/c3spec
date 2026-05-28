# c3spec

Code 3 Dev’s spec-driven development CLI.

`c3spec` is a fork of OpenSpec, adapted for Code 3 Dev workflows. It adds tiered routing, workflow memory, and opinionated agent skills so changes are scoped and reviewed before implementation.

## Why c3spec

- **Tiered front door** via `/c3spec:start`
  - **T1** Spec-Aware Fix
  - **T2** Lightweight Feature
  - **T3** Full Workflow
- **Workflow memory** in `c3spec/memory/`
- **Canonical skill system** under `.agents/skills/`
- **Spec-first change artifacts** under `c3spec/changes/`

## Install

### Global install from GitHub

```bash
npm install -g git+https://github.com/shwcsmack/c3spec.git
```

### Local development

```bash
pnpm install
pnpm build
node bin/c3spec.js --help
```

## Quickstart

1. Initialize c3spec in a repo:

```bash
c3spec init
```

2. Start work through your host’s c3spec command:

```text
/c3spec:start
```

3. Let the workflow interview + route the work to T1/T2/T3.

4. Continue, apply, verify, and archive with the generated change artifacts in `c3spec/changes/<change-id>/`.

## CLI examples

```bash
c3spec list
c3spec validate
c3spec archive <change-id>
c3spec ideas triage
```

## Project status

This is an actively maintained Code 3 Dev fork and is **not** a drop-in replacement for upstream OpenSpec defaults.

## Upstream attribution

Forked from [OpenSpec](https://github.com/Fission-AI/OpenSpec) by Fission AI.

- Original project: OpenSpec
- License: MIT

See [LICENSE](./LICENSE).
