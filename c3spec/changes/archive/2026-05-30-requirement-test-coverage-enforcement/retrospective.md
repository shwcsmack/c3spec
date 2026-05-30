# Retrospective

## What worked
- Incremental ratchet by spec family reduced risk.
- Explicit token format made automation deterministic.

## What didn’t
- Legacy loose `requirement:` strings created noisy unknown refs until parser was tightened.

## Learning
Use canonical token regex early to avoid migration noise.
