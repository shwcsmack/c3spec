# Migration Guide (to pi-only c3spec)

c3spec now uses a pi-only runtime model.

## What changed

- Removed: `c3spec init`
- Removed: `c3spec update`
- Runtime/package lifecycle moved to pi:
  - `pi install`
  - `pi update`
  - `pi remove`

## Migration steps

1. Install c3spec as a pi package.
2. Run workflows through `/c3spec:start` in pi.
3. Keep project artifacts under `c3spec/`.
4. Remove old host-specific assumptions from local docs/scripts.

## Validation

```bash
c3spec list
c3spec validate
```
