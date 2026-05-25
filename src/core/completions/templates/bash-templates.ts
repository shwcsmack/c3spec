/**
 * Static template strings for Bash completion scripts.
 * These are Bash-specific helper functions that never change.
 */

export const BASH_DYNAMIC_HELPERS = `# Dynamic completion helpers

_c3spec_complete_changes() {
  local changes
  changes=$(c3spec __complete changes 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$changes" -- "$cur"))
}

_c3spec_complete_specs() {
  local specs
  specs=$(c3spec __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$specs" -- "$cur"))
}

_c3spec_complete_items() {
  local items
  items=$(c3spec __complete changes 2>/dev/null | cut -f1; c3spec __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$items" -- "$cur"))
}

_c3spec_complete_schemas() {
  local schemas
  schemas=$(c3spec __complete schemas 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$schemas" -- "$cur"))
}`;
