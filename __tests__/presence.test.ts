import {STALE_MS, isOnline, presenceLabel} from '../src/utils/presence';

const NOW = 1_000_000_000;

describe('isOnline', () => {
  it('is true only with online=true and a fresh heartbeat', () => {
    expect(isOnline({online: true, lastActiveMs: NOW - 1000}, NOW)).toBe(true);
    expect(isOnline({online: true, lastActiveMs: NOW - STALE_MS - 1}, NOW)).toBe(false);
    expect(isOnline({online: false, lastActiveMs: NOW}, NOW)).toBe(false);
    expect(isOnline(undefined, NOW)).toBe(false);
  });
});

describe('presenceLabel', () => {
  it('describes online and offline members', () => {
    expect(presenceLabel({online: true, lastActiveMs: NOW}, NOW)).toBe('Active now');
    expect(presenceLabel({online: false, lastActiveMs: NOW - 5 * 60_000}, NOW)).toBe('Offline · active 5m ago');
    expect(presenceLabel({online: false, lastActiveMs: NOW - 3 * 3_600_000}, NOW)).toBe('Offline · active 3h ago');
    expect(presenceLabel({online: false, lastActiveMs: NOW - 2 * 86_400_000}, NOW)).toBe('Offline · active 2d ago');
    expect(presenceLabel({online: false, lastActiveMs: NOW - 30 * 86_400_000}, NOW)).toBe('Offline');
    expect(presenceLabel({online: false, lastActiveMs: 0}, NOW)).toBe('Offline');
  });
});
