import { describe, it, expect } from 'vitest';
import { isTelemetryEnabled, maybeShowTelemetryNotice, trackCommand, shutdown } from '../../src/telemetry/index.js';

describe('telemetry/index', () => {
  describe('isTelemetryEnabled', () => {
    it('always returns false — telemetry is disabled in c3spec', () => {
      expect(isTelemetryEnabled()).toBe(false);
    });
  });

  describe('no-op functions', () => {
    it('maybeShowTelemetryNotice resolves without throwing', async () => {
      await expect(maybeShowTelemetryNotice()).resolves.toBeUndefined();
    });

    it('trackCommand resolves without throwing', async () => {
      await expect(trackCommand('init', '1.0.0')).resolves.toBeUndefined();
    });

    it('shutdown resolves without throwing', async () => {
      await expect(shutdown()).resolves.toBeUndefined();
    });
  });
});
