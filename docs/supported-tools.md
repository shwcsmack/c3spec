# Supported Tools

c3spec supports three first-class agent hosts: Cursor, Claude Code, and Codex. When you run `c3spec init`, c3spec configures selected hosts using your active profile/workflow selection and delivery mode.

## How It Works

For each selected host, c3spec can install:

1. **Skills** (if delivery includes skills): host-specific skill directories
2. **Commands** (if delivery includes commands): host-specific `opsx-*` command files

By default, c3spec uses the `core` profile, which includes:
- `propose`
- `explore`
- `apply`
- `sync`
- `archive`

You can enable expanded workflows (`new`, `continue`, `ff`, `verify`, `bulk-archive`, `onboard`) via `c3spec config profile`, then run `c3spec update`.

## Tool Directory Reference

| Tool (ID) | Skills path pattern | Command path pattern |
|-----------|---------------------|----------------------|
| Claude Code (`claude`) | `.claude/skills/c3spec-*/SKILL.md` | `.claude/commands/c3spec/<id>.md` |
| Codex (`codex`) | `.agents/skills/c3spec-*/SKILL.md` | `$CODEX_HOME/prompts/opsx-<id>.md`\* |
| Cursor (`cursor`) | `.agents/skills/c3spec-*/SKILL.md` | `.cursor/commands/opsx-<id>.md` |

\* Codex commands are installed in the global Codex home (`$CODEX_HOME/prompts/` if set, otherwise `~/.codex/prompts/`), not your project directory.

Cursor and Codex read canonical skills from `.agents/skills/`. Claude Code receives a generated mirror under `.claude/skills/` because it does not read `.agents/skills/` directly.

## Non-Interactive Setup

For CI/CD or scripted setup, use `--tools` (and optionally `--profile`):

```bash
# Configure specific tools
c3spec init --tools claude,cursor

# Configure all supported tools
c3spec init --tools all

# Skip tool configuration
c3spec init --tools none

# Override profile for this init run
c3spec init --profile core
```

**Available tool IDs (`--tools`):** `all`, `none`, `claude`, `codex`, `cursor`

## Workflow-Dependent Installation

c3spec installs workflow artifacts based on selected workflows:

- **Core profile (default):** `propose`, `explore`, `apply`, `sync`, `archive`
- **Custom selection:** any subset of all workflow IDs:
  `propose`, `explore`, `new`, `continue`, `apply`, `ff`, `sync`, `archive`, `bulk-archive`, `verify`, `onboard`

In other words, skill/command counts are profile-dependent and delivery-dependent, not fixed.

## Generated Skill Names

Skills are generated with the `c3spec-` prefix:

- `c3spec-explore`
- `c3spec-propose`
- `c3spec-apply-change`
- `c3spec-sync-specs`
- `c3spec-archive-change`
- ... and others based on your selected workflows

## Related

- [CLI Reference](cli.md) — full command documentation
- [Getting Started](getting-started.md) — first-time setup walkthrough
