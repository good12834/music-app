/**
 * Audius trending & search helpers
 * Used by App.jsx to fetch real tracks from the Audius decentralized catalog.
 */

const AUDIUS_API_BASE = 'https://discoveryprovider.audius.co/v1';

const COLORS = ['#e8ff47','#47b3ff','#ff4747','#ff47e8','#47ffe8','#ffb347','#b347ff','#47ff8a','#ff8a47'];

function hashCode(str) {
  let hash = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function normalizeTrack(t) {
  const id = t.id ?? t.trackId ?? `${t.title}-${Math.random()}`;
  const color = COLORS[Math.abs(hashCode(id)) % COLORS.length];
  return {
    id,
    trackId: t.id ?? t.trackId,
    title: t.title ?? t.name ?? 'Untitled',
    artist: t.user?.name ?? t.artist ?? 'Unknown',
    genre: t.genre || 'Other',
    duration: t.duration || 0,
    play_count: t.play_count || t.playback_count || 0,
    url: t.stream_url ?? null,
    thumbnail: t.artwork?.['480x480'] ?? t.artwork?.['150x150'] ?? t.artwork?.url ?? t.thumbnail ?? null,
    color,
  };
}

export async function getTrendingTracks(limit = 20, genre = '') {
  try {
    // Try the local proxy first
    const q = new URLSearchParams();
    if (limit) q.set('limit', String(limit));
    if (genre) q.set('genre', genre);
    const proxyRes = await fetch(`/audius/tracks/trending?${q.toString()}`);
    if (proxyRes.ok) {
      const json = await proxyRes.json();
      const data = json?.data ?? json;
      return (Array.isArray(data) ? data : []).slice(0, limit).map(normalizeTrack);
    }
  } catch (e) {
    console.warn('Proxy fetch failed, trying Audius directly', e);
  }

  // Fallback: hit Audius API directly
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (genre) params.set('genre', genre);
    const res = await fetch(`${AUDIUS_API_BASE}/tracks/trending?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      const data = json?.data ?? json;
      return (Array.isArray(data) ? data : []).slice(0, limit).map(normalizeTrack);
    }
  } catch (e) {
    console.warn('Audius direct fetch failed', e);
  }

  // Final fallback
  const FALLBACK = [
    { id: '1', title: 'Track One', artist: 'Artist A' },
    { id: '2', title: 'Track Two', artist: 'Artist B' },
  ];
  return FALLBACK.slice(0, limit);
}

export async function searchTracks(query, limit = 20) {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `${AUDIUS_API_BASE}/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const data = json?.data ?? json;
      return (Array.isArray(data) ? data : []).map(normalizeTrack);
    }
  } catch (e) {
    console.warn('[audius] Search failed:', e.message);
  }

  return [];
}