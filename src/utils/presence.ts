// Presence is written by each signed-in device as a heartbeat (users/{uid}.online + lastActiveAt).
// A flag only counts as "online" while its heartbeat is fresh, so a crashed app cannot leave
// someone showing as online forever.

export const HEARTBEAT_MS = 60_000;
export const STALE_MS = 3 * 60_000;

export type PresenceUser = {
  online?: boolean;
  lastActiveMs?: number;
};

export function isOnline(user: PresenceUser | null | undefined, now: number = Date.now()): boolean {
  return !!user && user.online === true && (user.lastActiveMs ?? 0) > now - STALE_MS;
}

export function presenceLabel(user: PresenceUser | null | undefined, now: number = Date.now()): string {
  if (isOnline(user, now)) return 'Active now';
  const last = user?.lastActiveMs ?? 0;
  if (!last) return 'Offline';
  const minutes = Math.floor((now - last) / 60_000);
  if (minutes < 60) return `Offline · active ${Math.max(minutes, 1)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Offline · active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `Offline · active ${days}d ago` : 'Offline';
}
