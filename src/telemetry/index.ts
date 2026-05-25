export function isTelemetryEnabled(): boolean { return false; }
export function getOrCreateAnonymousId(): string { return ''; }
export async function maybeShowTelemetryNotice(): Promise<void> {}
export async function trackCommand(_command: string, _version: string): Promise<void> {}
export async function shutdown(): Promise<void> {}
