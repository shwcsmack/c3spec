# Workflows (pi-only)

Use c3spec through pi with `/c3spec:start` as the single front door.

## Flow

1. `/c3spec:start`
2. Interview + routing (Research / T1 / T2 / T3)
3. Artifact-driven execution
4. Verify + archive

## Key commands

```bash
c3spec status --change <name>
c3spec instructions --change <name>
c3spec archive <name>
```

For package install/update/remove, use pi package lifecycle commands.
