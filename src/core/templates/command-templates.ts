/**
 * Slash-command templates for legacy workflow command drift detection.
 */

export type { CommandTemplate } from './types.js';

export { getOpsxExploreCommandTemplate } from './commands/explore.js';
export { getOpsxNewCommandTemplate } from './commands/new-change.js';
export { getOpsxContinueCommandTemplate } from './commands/continue-change.js';
export { getOpsxApplyCommandTemplate } from './commands/apply-change.js';
export { getOpsxFfCommandTemplate } from './commands/ff-change.js';
export { getOpsxSyncCommandTemplate } from './commands/sync-specs.js';
export { getOpsxArchiveCommandTemplate } from './commands/archive-change.js';
export { getOpsxBulkArchiveCommandTemplate } from './commands/bulk-archive-change.js';
export { getOpsxVerifyCommandTemplate } from './commands/verify-change.js';
export { getOpsxOnboardCommandTemplate } from './commands/onboard.js';
export { getOpsxProposeCommandTemplate } from './commands/propose.js';
