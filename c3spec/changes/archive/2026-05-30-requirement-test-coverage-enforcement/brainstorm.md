# Brainstorm

## Problem
Spec requirements lacked enforceable test linkage in CI.

## Direction
Adopt explicit requirement IDs in spec headers and explicit `requirement: <ID>` tokens in tests.

## Risks
- Large migration churn
- False positives from non-canonical tokens

## Decision
Ship phased enforcement with baseline first, then ratchet to full coverage and strict unknown-ref checks.