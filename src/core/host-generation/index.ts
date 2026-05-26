import { discoverCanonicalArtifacts, assertSupportedHostId } from './canonical.js';
import { getHostRenderer, listHostRenderers } from './renderers/index.js';
import type {
  CanonicalHostArtifacts,
  CanonicalValidationError,
  GeneratedHostFile,
  HostRenderer,
  SupportedHostId,
} from './types.js';

export {
  discoverCanonicalArtifacts,
  parseAgentManifest,
  parseHookManifest,
  parseSkillFile,
  validateHostIds,
  isSupportedHostId,
  assertSupportedHostId,
  CANONICAL_PATHS,
} from './canonical.js';

export {
  buildJsonSidecarSentinel,
  computeContentHash,
  extractSentinelMetadata,
  hasGeneratedContentDrifted,
  isGeneratedByC3spec,
  parseJsonSidecarSentinel,
  stripSentinel,
  withSentinel,
} from './sentinel.js';

export type { SentinelMetadata } from './sentinel.js';

export {
  getHostRenderer,
  listHostRenderers,
  cursorRenderer,
  claudeRenderer,
  codexRenderer,
} from './renderers/index.js';

export type {
  CanonicalAgentManifest,
  CanonicalHookManifest,
  CanonicalHostArtifacts,
  CanonicalSkill,
  CanonicalValidationError,
  GeneratedHostFile,
  HostRenderer,
  RequiredCanonicalAgentName,
  RequiredCanonicalHookName,
  RequiredCanonicalSkillName,
  SentinelFormat,
  SupportedHostId,
} from './types.js';

export { SUPPORTED_HOST_IDS, REQUIRED_CANONICAL_SKILL_NAMES } from './types.js';

export function renderHostFiles(
  hostId: string,
  artifacts: CanonicalHostArtifacts
): GeneratedHostFile[] {
  return getHostRenderer(hostId).render(artifacts);
}

export function renderHostFilesForHosts(
  hostIds: readonly string[],
  artifacts: CanonicalHostArtifacts
): GeneratedHostFile[] {
  const files: GeneratedHostFile[] = [];

  for (const hostId of hostIds) {
    files.push(...renderHostFiles(hostId, artifacts));
  }

  files.sort((a, b) => a.path.localeCompare(b.path));
  return files;
}

export async function generateHostFilesFromProject(
  projectRoot: string,
  hostIds: readonly SupportedHostId[]
): Promise<{ files: GeneratedHostFile[]; artifacts: CanonicalHostArtifacts; errors: CanonicalValidationError[] }> {
  const { artifacts, errors } = await discoverCanonicalArtifacts(projectRoot);
  if (errors.length > 0) {
    return { files: [], artifacts, errors };
  }

  const validatedHostIds = hostIds.map((hostId) => assertSupportedHostId(hostId));
  const files = renderHostFilesForHosts(validatedHostIds, artifacts);
  return { files, artifacts, errors: [] };
}

export function getRegisteredHostRenderers(): HostRenderer[] {
  return listHostRenderers();
}

export {
  applyHostGenerationPipeline,
  formatHostGenerationSummary,
  getHostConfiguredTools,
  hostGenerationNeedsUpdate,
  loadBundledCanonicalFiles,
  loadCanonicalTargetsWithRemote,
  resolveHostIdsFromToolSelection,
  writeCanonicalArtifacts,
  writeGeneratedHostFiles,
} from './apply.js';

export type {
  ApplyHostGenerationOptions,
  BundledCanonicalFile,
  CanonicalWriteResult,
  HostGenerationApplySummary,
  HostWriteResult,
  RemoteCanonicalSkillFetchSummary,
} from './apply.js';
