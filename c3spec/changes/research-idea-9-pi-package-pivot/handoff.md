# Handoff

## Implementation candidates

1. **Packaging baseline (likely Tier 2)**
   - Add `pi` manifest to `package.json` and package resource layout
   - Ensure canonical skills/extensions/prompts map cleanly into pi package loading

2. **Runtime contract transition (Tier 3)**
   - Define pi-only workflow contract
   - Remove host-generation assumptions and rewrite docs around pi runtime
   - Decommission host-specific generated surfaces

3. **Pi-native capability uplift (Tier 2 follow-on slices)**
   - Introduce pi-native extensions/commands/tooling where they simplify c3spec workflows
   - Tighten package UX for install, update, and contributor onboarding

## Suggested next tier

- **Tier 3 Full Workflow** for the pi-only architecture and migration execution plan
- Then bounded Tier 2 slices for capability uplift and polish

## Key open risks

- User churn from non-pi host removal
- Migration breakage risk while deleting host-generation code paths
- Documentation/support load during the transition window

## Proposed phased plan

- **Phase A:** Establish pi-only package baseline and workflow contract
- **Phase B:** Remove host-generation/runtime branching and regenerate docs/specs around pi
- **Phase C:** Deliver pi-native UX and capability optimizations using extensions/SDK/runtime APIs
