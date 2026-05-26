import { createHash } from 'crypto';
import type { SentinelFormat } from './types.js';

export interface SentinelMetadata {
  generated: true;
  source: string;
  hash: string;
}

const SENTINEL_GENERATED = 'c3spec-generated: true';
const SENTINEL_SOURCE_PREFIX = 'c3spec-source:';
const SENTINEL_HASH_PREFIX = 'c3spec-hash:';

const MARKDOWN_SENTINEL_PATTERN =
  /<!--\s*c3spec-generated:\s*true[\s\S]*?c3spec-source:\s*[^\n]+[\s\S]*?c3spec-hash:\s*[a-f0-9]{64}\s*-->\s*/i;

export function computeContentHash(content: string): string {
  return createHash('sha256').update(normalizePayload(content), 'utf8').digest('hex');
}

function normalizePayload(content: string): string {
  return `${content.replace(/\s*$/, '')}\n`;
}

function parseSentinelPayload(payload: string): SentinelMetadata | null {
  const lines = payload
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let generated = false;
  let source: string | undefined;
  let hash: string | undefined;

  for (const line of lines) {
    if (line === SENTINEL_GENERATED) {
      generated = true;
      continue;
    }
    if (line.startsWith(SENTINEL_SOURCE_PREFIX)) {
      source = line.slice(SENTINEL_SOURCE_PREFIX.length).trim();
      continue;
    }
    if (line.startsWith(SENTINEL_HASH_PREFIX)) {
      hash = line.slice(SENTINEL_HASH_PREFIX.length).trim();
    }
  }

  if (!generated || !source || !hash) {
    return null;
  }

  return { generated: true, source, hash };
}

function buildSentinelPayload(metadata: SentinelMetadata): string {
  return `${SENTINEL_GENERATED}
${SENTINEL_SOURCE_PREFIX} ${metadata.source}
${SENTINEL_HASH_PREFIX} ${metadata.hash}`;
}

export function stripSentinel(
  content: string,
  format: SentinelFormat
): { content: string; metadata: SentinelMetadata | null } {
  if (format === 'markdown') {
    const match = content.match(MARKDOWN_SENTINEL_PATTERN);
    if (!match) {
      return { content, metadata: null };
    }

    const payload = match[0]
      .replace(/^<!--\s*/i, '')
      .replace(/\s*-->\s*$/i, '')
      .trim();

    return {
      content: normalizePayload(content.replace(MARKDOWN_SENTINEL_PATTERN, '')),
      metadata: parseSentinelPayload(payload),
    };
  }

  if (format === 'toml') {
    const { metadata, endIndex } = parseTomlSentinelComments(content);
    if (!metadata) {
      return { content, metadata: null };
    }
    return { content: normalizePayload(content.slice(endIndex).replace(/^\n+/, '')), metadata };
  }

  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const raw = parsed._c3spec;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { content, metadata: null };
    }

    const record = raw as Record<string, unknown>;
    if (
      record.generated !== true ||
      typeof record.source !== 'string' ||
      typeof record.hash !== 'string'
    ) {
      return { content, metadata: null };
    }

    delete parsed._c3spec;
    return {
      content: normalizePayload(`${JSON.stringify(parsed, null, 2)}`),
      metadata: {
        generated: true,
        source: record.source,
        hash: record.hash,
      },
    };
  } catch {
    return { content, metadata: null };
  }
}

function parseTomlSentinelComments(content: string): { metadata: SentinelMetadata | null; endIndex: number } {
  const lines = content.split('\n');
  const payloadLines: string[] = [];
  let endIndex = 0;

  for (const line of lines) {
    if (!line.startsWith('# c3spec-')) {
      break;
    }
    payloadLines.push(line.slice(2).trim());
    endIndex += line.length + 1;
  }

  if (payloadLines.length === 0) {
    return { metadata: null, endIndex: 0 };
  }

  return { metadata: parseSentinelPayload(payloadLines.join('\n')), endIndex };
}

function buildMarkdownSentinel(metadata: SentinelMetadata): string {
  return `<!-- ${buildSentinelPayload(metadata)} -->\n\n`;
}

function buildTomlSentinel(metadata: SentinelMetadata): string {
  return `${buildSentinelPayload(metadata)
    .split('\n')
    .map((line) => `# ${line}`)
    .join('\n')}\n\n`;
}

function buildJsonSentinel(metadata: SentinelMetadata): Record<string, unknown> {
  return {
    generated: metadata.generated,
    source: metadata.source,
    hash: metadata.hash,
  };
}

export function withSentinel(
  content: string,
  source: string,
  format: SentinelFormat
): string {
  const stripped = stripSentinel(content, format);
  const hash = computeContentHash(stripped.content);
  const metadata: SentinelMetadata = {
    generated: true,
    source,
    hash,
  };

  if (format === 'markdown') {
    const body = normalizePayload(stripped.content);
    return `${body}\n${buildMarkdownSentinel(metadata).trimEnd()}\n`;
  }

  if (format === 'toml') {
    const body = normalizePayload(stripped.content.replace(/^\n+/, ''));
    return `${buildTomlSentinel(metadata)}${body}`.replace(/\s*$/, '\n');
  }

  const parsed = JSON.parse(stripped.content) as Record<string, unknown>;
  parsed._c3spec = buildJsonSentinel(metadata);
  return normalizePayload(`${JSON.stringify(parsed, null, 2)}`);
}

export function buildJsonSidecarSentinel(content: string, source: string): string {
  const metadata: SentinelMetadata = {
    generated: true,
    source,
    hash: computeContentHash(content),
  };
  return normalizePayload(`${JSON.stringify(metadata, null, 2)}`);
}

export function parseJsonSidecarSentinel(content: string): SentinelMetadata | null {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    if (
      parsed.generated !== true ||
      typeof parsed.source !== 'string' ||
      typeof parsed.hash !== 'string'
    ) {
      return null;
    }
    return {
      generated: true,
      source: parsed.source,
      hash: parsed.hash,
    };
  } catch {
    return null;
  }
}

export function isGeneratedByC3spec(content: string, format: SentinelFormat): boolean {
  return stripSentinel(content, format).metadata !== null;
}

export function hasGeneratedContentDrifted(content: string, format: SentinelFormat): boolean {
  const { content: strippedContent, metadata } = stripSentinel(content, format);
  if (!metadata) {
    return false;
  }

  return computeContentHash(strippedContent) !== metadata.hash;
}

export function extractSentinelMetadata(
  content: string,
  format: SentinelFormat
): SentinelMetadata | null {
  return stripSentinel(content, format).metadata;
}
