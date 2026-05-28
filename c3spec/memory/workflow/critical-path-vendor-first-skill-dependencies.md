# Critical-path vendor-first skill dependency strategy

## Context
When reducing external skill dependencies, full vendoring in one pass can over-scope the change and delay delivery.

## Learning
Use a two-track approach:
1. Vendor only critical-path dependencies required for end-to-end workflow reliability.
2. In the same change, produce a direct + nested dependency map and prioritized adoption list for non-critical skills.

## Why it helps
This pattern removes immediate operational risk quickly while preserving strategic improvement planning with explicit follow-up targets.
