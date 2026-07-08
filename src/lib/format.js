export const ONLINE_WINDOW_MS = 30000; // a TV polls every 5s; 30s grace = offline

export function isOnline(lastSeenIso) {
  if (!lastSeenIso) return false;
  const t = new Date(lastSeenIso).getTime();
  return Number.isFinite(t) && Date.now() - t < ONLINE_WINDOW_MS;
}

export function timeAgo(iso) {
  if (!iso) return 'never';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 'never';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
