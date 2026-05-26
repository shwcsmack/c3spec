/**
 * Command Reference Utilities
 *
 * Utilities for transforming command references to tool-specific formats.
 */

/**
 * Transforms colon-based command references to hyphen-based format.
 * Converts `/opsx:` patterns to `/opsx-` for tools that use hyphen syntax.
 *
 * @param text - The text containing command references
 * @returns Text with command references transformed to hyphen format
 *
 * @example
 * transformToHyphenCommands('/opsx:new') // returns '/opsx-new'
 * transformToHyphenCommands('Use /opsx:apply to implement') // returns 'Use /opsx-apply to implement'
 */
export function transformToHyphenCommands(text: string): string {
  return text.replace(/\/opsx:/g, '/opsx-');
}

/**
 * Transforms canonical `/opsx:` command references to Claude Code's `/c3spec:` namespace.
 * Used by the Claude adapter since commands live under `.claude/commands/c3spec/`.
 */
export function transformToC3specCommands(text: string): string {
  return text.replace(/\/opsx:/g, '/c3spec:');
}
