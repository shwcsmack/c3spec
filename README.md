# c3spec

Code 3 Dev spec-driven development CLI

c3spec is a spec-driven development workflow CLI forked from OpenSpec and tailored for Code 3 Dev projects. It provides tiered change routing (T1 fix, T2 feature, T3 full workflow), a project memory system, and opinionated scaffolding so AI assistants and developers stay aligned on requirements before writing code.

## Install

```bash
npm install -g git+https://github.com/shwcsmack/c3spec.git
```

## Usage

Initialize a project:

```bash
c3spec init
```

Manage project memory:

```bash
c3spec memory
```

The primary workflow runs through `/opsx:start` in supported AI tools (e.g. Claude Code). That command interviews you, routes to the correct tier, and drives planning and implementation.

## Commands

| Command | Description |
|---|---|
| `init` | Initialize c3spec in the current project directory |
| `memory list` | List all memory entries in the project memory index |
| `memory add` | Add a new memory entry |
| `memory promote` | Promote a local memory entry to global |
| `archive` | Archive a completed change to the archive directory |
| `validate` | Validate change artifacts against the schema |
| `status` | Show the status of the current active change |

## Attribution

Forked from [OpenSpec](https://github.com/Fission-AI/OpenSpec) by Fission AI. MIT License.
