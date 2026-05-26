import { createRequire } from 'module';
import { createHash } from 'crypto';
import path from 'path';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import { discoverCanonicalArtifacts } from './canonical.js';
import { getHostRenderer } from './renderers/index.js';
import {
  computeContentHash,
  hasGeneratedContentDrifted,
  isGeneratedByC3spec,
  parseJsonSidecarSentinel,
} from './sentinel.js';
import {
  REQUIRED_CANONICAL_SKILL_NAMES,
  type GeneratedHostFile,
  type SentinelFormat,
  type SupportedHostId,
} from './types.js';
import { isSupportedHostId } from './canonical.js';

const require = createRequire(import.meta.url);

const REMOTE_CANONICAL_SKILL_BASE_URL =
  'https://raw.githubusercontent.com/shwcsmack/c3spec/main/.agents/skills';
const FETCH_TIMEOUT_MS = 5000;

export interface CanonicalWriteResult {
  created: string[];
  updated: string[];
  skipped: string[];
  driftWarnings: string[];
}

export interface HostWriteResult {
  written: string[];
  unchanged: string[];
  skipped: string[];
  driftWarnings: string[];
}

export interface ApplyHostGenerationOptions {
  force?: boolean;
  ensureCanonical?: boolean;
  refreshCanonical?: boolean;
  fetchRemoteCanonicalSkills?: boolean;
}

function normalizeEol(content: string): string {
  return content.replace(/\r\n/g, '\n');
}

function contentEquals(a: string, b: string): boolean {
  return normalizeEol(a) === normalizeEol(b);
}

export function resolveBundledAgentsDir(): string {
  const packageJsonPath = require.resolve('../../../package.json');
  return path.join(path.dirname(packageJsonPath), '.agents');
}

export interface BundledCanonicalFile {
  relativePath: string;
  content: string;
}

export async function loadBundledCanonicalFiles(): Promise<BundledCanonicalFile[]> {
  const agentsDir = resolveBundledAgentsDir();
  const files: BundledCanonicalFile[] = [];

  for (const skillName of REQUIRED_CANONICAL_SKILL_NAMES) {
    const relativePath = path.join('.agents', 'skills', skillName, 'SKILL.md');
    const absolutePath = path.join(agentsDir, 'skills', skillName, 'SKILL.md');
    files.push({
      relativePath: relativePath.replace(/\\/g, '/'),
      content: await fs.readFile(absolutePath, 'utf8'),
    });
  }

  const agentsDirPath = path.join(agentsDir, 'agents');
  for (const entry of await fs.readdir(agentsDirPath)) {
    if (!entry.endsWith('.yaml') && !entry.endsWith('.yml')) {
      continue;
    }
    const relativePath = path.join('.agents', 'agents', entry).replace(/\\/g, '/');
    files.push({
      relativePath,
      content: await fs.readFile(path.join(agentsDirPath, entry), 'utf8'),
    });
  }

  const hooksDirPath = path.join(agentsDir, 'hooks');
  for (const entry of await fs.readdir(hooksDirPath)) {
    const relativePath = path.join('.agents', 'hooks', entry).replace(/\\/g, '/');
    files.push({
      relativePath,
      content: await fs.readFile(path.join(hooksDirPath, entry), 'utf8'),
    });
  }

  return files;
}

async function fetchRemoteCanonicalSkill(skillName: string): Promise<string | null> {
  const url = `${REMOTE_CANONICAL_SKILL_BASE_URL}/${skillName}/SKILL.md`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
}

export interface RemoteCanonicalSkillFetchSummary {
  files: BundledCanonicalFile[];
  remoteFallbackCount: number;
}

/**
 * Loads bundled canonical files and optionally replaces skill bodies from GitHub.
 */
export async function loadCanonicalTargetsWithRemote(
  fetchRemote: boolean
): Promise<RemoteCanonicalSkillFetchSummary> {
  const bundled = await loadBundledCanonicalFiles();
  if (!fetchRemote) {
    return { files: bundled, remoteFallbackCount: 0 };
  }

  let remoteFallbackCount = 0;
  const files = await Promise.all(
    bundled.map(async (file) => {
      const skillMatch = file.relativePath.match(/^\.agents\/skills\/([^/]+)\/SKILL\.md$/);
      if (!skillMatch) {
        return file;
      }

      const skillName = skillMatch[1];
      const remote = await fetchRemoteCanonicalSkill(skillName);
      if (remote === null) {
        remoteFallbackCount++;
        return file;
      }

      return { ...file, content: remote };
    })
  );

  return { files, remoteFallbackCount };
}

function hashCanonicalContent(content: string): string {
  return createHash('sha256').update(normalizeEol(content), 'utf8').digest('hex');
}

export async function writeCanonicalArtifacts(
  projectRoot: string,
  targetFiles: BundledCanonicalFile[],
  options: { force?: boolean } = {}
): Promise<CanonicalWriteResult> {
  const force = options.force ?? false;
  const result: CanonicalWriteResult = {
    created: [],
    updated: [],
    skipped: [],
    driftWarnings: [],
  };

  for (const file of targetFiles) {
    const absolutePath = path.join(projectRoot, file.relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });

    let existing: string | null = null;
    try {
      existing = await fs.readFile(absolutePath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    if (existing === null) {
      await fs.writeFile(absolutePath, file.content, 'utf8');
      result.created.push(file.relativePath);
      continue;
    }

    if (contentEquals(existing, file.content)) {
      result.skipped.push(file.relativePath);
      continue;
    }

    if (!force) {
      result.driftWarnings.push(file.relativePath);
      result.skipped.push(file.relativePath);
      continue;
    }

    await fs.writeFile(absolutePath, file.content, 'utf8');
    result.updated.push(file.relativePath);
  }

  return result;
}

function sentinelFormatForPath(relativePath: string): SentinelFormat {
  if (relativePath.endsWith('.md')) {
    return 'markdown';
  }
  if (relativePath.endsWith('.toml')) {
    return 'toml';
  }
  return 'json';
}

function usesJsonSidecar(relativePath: string): boolean {
  return relativePath.endsWith('.json') && !relativePath.endsWith('.c3spec.json');
}

type WriteDecision = 'write' | 'unchanged' | 'skip-drift' | 'skip-unmanaged';

async function decideGeneratedFileWrite(
  projectRoot: string,
  relativePath: string,
  newContent: string,
  force: boolean
): Promise<WriteDecision> {
  const absolutePath = path.join(projectRoot, relativePath);

  let existing: string | null = null;
  try {
    existing = await fs.readFile(absolutePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return 'write';
    }
    throw error;
  }

  if (contentEquals(existing, newContent)) {
    return 'unchanged';
  }

  if (relativePath.endsWith('.c3spec.json')) {
    return 'write';
  }

  if (usesJsonSidecar(relativePath)) {
    const sidecarPath = `${absolutePath}.c3spec.json`;
    let sidecarContent: string | null = null;
    try {
      sidecarContent = await fs.readFile(sidecarPath, 'utf8');
    } catch {
      // no sidecar
    }

    if (!sidecarContent) {
      return force ? 'write' : 'skip-unmanaged';
    }

    const metadata = parseJsonSidecarSentinel(sidecarContent);
    if (!metadata) {
      return force ? 'write' : 'skip-unmanaged';
    }

    const payloadHash = computeContentHash(existing);
    if (payloadHash !== metadata.hash) {
      return force ? 'write' : 'skip-drift';
    }

    return 'write';
  }

  const format = sentinelFormatForPath(relativePath);
  if (!isGeneratedByC3spec(existing, format)) {
    return force ? 'write' : 'skip-unmanaged';
  }

  if (hasGeneratedContentDrifted(existing, format)) {
    return force ? 'write' : 'skip-drift';
  }

  return 'write';
}

export async function writeGeneratedHostFiles(
  projectRoot: string,
  files: GeneratedHostFile[],
  options: { force?: boolean } = {}
): Promise<HostWriteResult> {
  const force = options.force ?? false;
  const result: HostWriteResult = {
    written: [],
    unchanged: [],
    skipped: [],
    driftWarnings: [],
  };

  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sorted) {
    const decision = await decideGeneratedFileWrite(projectRoot, file.path, file.content, force);

    if (decision === 'unchanged') {
      result.unchanged.push(file.path);
      continue;
    }

    if (decision === 'skip-drift') {
      result.driftWarnings.push(file.path);
      result.skipped.push(file.path);
      continue;
    }

    if (decision === 'skip-unmanaged') {
      result.skipped.push(file.path);
      continue;
    }

    const absolutePath = path.join(projectRoot, file.path);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file.content, 'utf8');
    result.written.push(file.path);
  }

  return result;
}

export function getHostConfiguredTools(projectRoot: string): SupportedHostId[] {
  const hosts = new Set<SupportedHostId>();

  if (
    fsSync.existsSync(
      path.join(projectRoot, '.claude', 'skills', 'c3spec-start', 'SKILL.md')
    )
  ) {
    hosts.add('claude');
  }
  if (fsSync.existsSync(path.join(projectRoot, '.cursor', 'agents', 'implementer.md'))) {
    hosts.add('cursor');
  }
  if (fsSync.existsSync(path.join(projectRoot, '.codex', 'agents', 'implementer.toml'))) {
    hosts.add('codex');
  }

  return [...hosts].sort();
}

export function resolveHostIdsFromToolSelection(toolIds: readonly string[]): SupportedHostId[] {
  const hostIds: SupportedHostId[] = [];
  for (const toolId of toolIds) {
    if (isSupportedHostId(toolId)) {
      hostIds.push(toolId);
    }
  }
  return [...new Set(hostIds)];
}

export async function hostGenerationNeedsUpdate(
  projectRoot: string,
  hostIds: readonly SupportedHostId[],
  targetCanonicalFiles: BundledCanonicalFile[]
): Promise<boolean> {
  for (const file of targetCanonicalFiles) {
    const absolutePath = path.join(projectRoot, file.relativePath);
    try {
      const existing = await fs.readFile(absolutePath, 'utf8');
      if (!contentEquals(existing, file.content)) {
        return true;
      }
    } catch {
      return true;
    }
  }

  const { artifacts, errors } = await discoverCanonicalArtifacts(projectRoot);
  if (errors.length > 0) {
    return true;
  }

  const expectedFiles: GeneratedHostFile[] = [];
  for (const hostId of hostIds) {
    expectedFiles.push(...getHostRenderer(hostId).render(artifacts));
  }

  for (const file of expectedFiles) {
    if (file.path.endsWith('.c3spec.json')) {
      continue;
    }

    const absolutePath = path.join(projectRoot, file.path);
    try {
      const existing = await fs.readFile(absolutePath, 'utf8');
      if (!contentEquals(existing, file.content)) {
        return true;
      }
    } catch {
      return true;
    }
  }

  return false;
}

export interface HostGenerationApplySummary {
  canonical: CanonicalWriteResult;
  hosts: HostWriteResult;
  validationErrors: Array<{ path: string; message: string }>;
  remoteFallbackCount: number;
}

export async function applyHostGenerationPipeline(
  projectRoot: string,
  hostIds: readonly SupportedHostId[],
  options: ApplyHostGenerationOptions = {}
): Promise<HostGenerationApplySummary> {
  const force = options.force ?? false;
  const ensureCanonical = options.ensureCanonical ?? false;
  const refreshCanonical = options.refreshCanonical ?? false;
  const fetchRemote = options.fetchRemoteCanonicalSkills ?? false;

  let canonical: CanonicalWriteResult = {
    created: [],
    updated: [],
    skipped: [],
    driftWarnings: [],
  };
  let remoteFallbackCount = 0;

  if (refreshCanonical) {
    const { files, remoteFallbackCount: fallbackCount } = await loadCanonicalTargetsWithRemote(
      fetchRemote
    );
    remoteFallbackCount = fallbackCount;
    canonical = await writeCanonicalArtifacts(projectRoot, files, { force });
  } else if (ensureCanonical) {
    const bundled = await loadBundledCanonicalFiles();
    canonical = await writeCanonicalArtifacts(projectRoot, bundled, { force });
  }

  const { artifacts, errors } = await discoverCanonicalArtifacts(projectRoot);
  if (errors.length > 0) {
    return {
      canonical,
      hosts: { written: [], unchanged: [], skipped: [], driftWarnings: [] },
      validationErrors: errors,
      remoteFallbackCount,
    };
  }

  const files: GeneratedHostFile[] = [];
  for (const hostId of hostIds) {
    files.push(...getHostRenderer(hostId).render(artifacts));
  }
  files.sort((a, b) => a.path.localeCompare(b.path));

  const hosts = await writeGeneratedHostFiles(projectRoot, files, { force });

  return {
    canonical,
    hosts,
    validationErrors: [],
    remoteFallbackCount,
  };
}

export function formatHostGenerationSummary(
  hostIds: readonly SupportedHostId[],
  summary: HostGenerationApplySummary
): string[] {
  const lines: string[] = [];

  const canonicalCount =
    summary.canonical.created.length + summary.canonical.updated.length;
  if (canonicalCount > 0) {
    lines.push(
      `Canonical (.agents/): ${summary.canonical.created.length} created, ${summary.canonical.updated.length} refreshed`
    );
  } else if (summary.canonical.skipped.length > 0) {
    lines.push(`Canonical (.agents/): ${summary.canonical.skipped.length} unchanged`);
  }

  if (summary.hosts.written.length > 0) {
    lines.push(`Host artifacts: ${summary.hosts.written.length} written for ${hostIds.join(', ')}`);
  }
  if (summary.hosts.unchanged.length > 0) {
    lines.push(`Unchanged: ${summary.hosts.unchanged.length} generated file(s)`);
  }
  if (summary.hosts.skipped.length > 0) {
    lines.push(`Skipped: ${summary.hosts.skipped.length} file(s) (use --force to overwrite)`);
  }

  return lines;
}

export { hashCanonicalContent };
