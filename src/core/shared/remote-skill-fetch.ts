/**
 * Remote Skill Fetch
 *
 * Fetches skill instructions from the canonical GitHub source at runtime,
 * falling back to bundled templates on any failure.
 */

import type { SkillTemplate } from '../templates/types.js';
import type { SkillTemplateEntry } from './skill-generation.js';

const REMOTE_BASE_URL =
  'https://raw.githubusercontent.com/shwcsmack/c3spec/main/skills';

const FETCH_TIMEOUT_MS = 5000;

/**
 * Parses a SKILL.md string (frontmatter + body) and returns the instructions body.
 * Returns null if the format is not recognized.
 */
function parseSkillBody(content: string): string | null {
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  if (!match) return null;
  return match[1].replace(/^\n/, '');
}

/**
 * Fetches a single SKILL.md from GitHub and extracts the instructions body.
 * Returns null on any network error, timeout, non-200 response, or parse failure.
 */
async function fetchRemoteSkillBody(dirName: string): Promise<string | null> {
  const url = `${REMOTE_BASE_URL}/${dirName}/SKILL.md`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) return null;

    const text = await response.text();
    return parseSkillBody(text);
  } catch {
    return null;
  }
}

/**
 * Result of a remote skill fetch attempt for one entry.
 */
export interface RemoteFetchResult {
  entry: SkillTemplateEntry;
  /** true when the remote instructions were used, false when bundled fallback was used */
  usedRemote: boolean;
}

/**
 * Fetches skill instructions from GitHub for all entries in parallel.
 * Each entry falls back to its bundled template if the fetch fails or times out.
 *
 * @returns Array of results in the same order as `entries`, each annotated with
 *   whether the remote payload was used.
 */
export async function fetchRemoteSkills(
  entries: SkillTemplateEntry[]
): Promise<RemoteFetchResult[]> {
  const fetches = entries.map((entry) => fetchRemoteSkillBody(entry.dirName));
  const bodies = await Promise.all(fetches);

  return entries.map((entry, i) => {
    const remoteBody = bodies[i];
    if (remoteBody === null) {
      return { entry, usedRemote: false };
    }

    const remoteTemplate: SkillTemplate = {
      ...entry.template,
      instructions: remoteBody,
    };
    return { entry: { ...entry, template: remoteTemplate }, usedRemote: true };
  });
}
