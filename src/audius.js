/**
 * Audius API helper
 * Resolves track IDs to stream URLs via the Audius decentralized music API.
 * Falls back gracefully — if a track has no trackId, the player uses track.url instead.
 */

const AUDIUS_API_BASE = 'https://discoveryprovider.audius.co/v1';

/**
 * Returns a direct stream URL for an Audius track ID.
 * This URL is passed to the <audio> element's src.
 */
export function getStreamUrl(trackId) {
  if (!trackId) return '';
  return `${AUDIUS_API_BASE}/tracks/${trackId}/stream`;
}

/**
 * Fetch track metadata from Audius by ID.
 */
export async function fetchTrackById(trackId) {
  try {
    const res = await fetch(`${AUDIUS_API_BASE}/tracks/${trackId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data } = await res.json();
    return data;
  } catch (err) {
    console.warn(`[audius] Failed to fetch track ${trackId}:`, err.message);
    return null;
  }
}

/**
 * Search Audius for tracks matching a query string.
 * Returns an array of track objects shaped to match our TRACKS format.
 */
export async function searchAudiusTracks(query, limit = 10) {
  try {
    const url = `${AUDIUS_API_BASE}/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data } = await res.json();
    return (data || []).map(normalizeAudiusTrack);
  } catch (err) {
    console.warn('[audius] Search failed:', err.message);
    return [];
  }
}

/**
 * Fetch trending tracks from Audius.
 */
export async function fetchTrendingTracks(limit = 10) {
  try {
    const res = await fetch(`${AUDIUS_API_BASE}/tracks/trending?limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data } = await res.json();
    return (data || []).map(normalizeAudiusTrack);
  } catch (err) {
    console.warn('[audius] Trending fetch failed:', err.message);
    return [];
  }
}

/**
 * Normalize an Audius API track object into our internal track shape.
 */
export function normalizeAudiusTrack(apiTrack) {
  const COLORS = ['#e8ff47','#47b3ff','#ff4747','#ff47e8','#47ffe8','#ffb347','#b347ff','#47ff8a','#ff8a47'];
  const color = COLORS[Math.abs(hashCode(apiTrack.id)) % COLORS.length];
  return {
    id: apiTrack.id,
    trackId: apiTrack.id,           // Audius ID used to build stream URL
    title: apiTrack.title || 'Unknown Title',
    artist: apiTrack.user?.name || 'Unknown Artist',
    album: apiTrack.album || '',
    genre: apiTrack.genre || 'Other',
    duration: apiTrack.duration || 180,
    year: apiTrack.release_date ? new Date(apiTrack.release_date).getFullYear() : 2024,
    bpm: apiTrack.bpm || 120,
    color,
    label: apiTrack.user?.name || '',
    key: apiTrack.musical_key || '',
    thumbnail: apiTrack.artwork?.['480x480'] || apiTrack.artwork?.['150x150'] || null,
  };
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Minimal SVG data URI placeholder for image fallbacks
const PLACEHOLDER_DATA_URI = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="480" height="480"/%3E';

// Throttle logging for retry attempts
let lastRetryLog = 0;
const RETRY_LOG_THROTTLE = 5000;

// Track URLs that have failed to load
const failedUrls = new Set();

// Track consecutive 503 errors - if > N failures in M seconds, assume server is down
let consecutive503Failures = 0;
let last503FailureTime = 0;
const FAILURE_WINDOW = 30000; // 30 seconds
const FAILURE_THRESHOLD = 3; // 3 failures triggers fallback mode
let serverUnavailableMode = false;

/**
 * Returns a safe image URL with fallback handling for 503 errors.
 * If the URL has previously failed, returns a data URI placeholder.
 * If server is in unavailable mode, returns placeholder immediately.
 */
export function getImageWithFallback(url) {
  if (!url) return PLACEHOLDER_DATA_URI;
  
  // Return placeholder for URLs that have failed
  if (failedUrls.has(url)) {
    return PLACEHOLDER_DATA_URI;
  }
  
  // If server is in unavailable mode, return placeholder
  if (serverUnavailableMode) {
    return PLACEHOLDER_DATA_URI;
  }
  
  // Check if this looks like an Audius content URL that might 503
  const isAudiusContent = url.includes('audius') || url.includes('bragi') || url.includes('altego');
  
  if (isAudiusContent) {
    const now = Date.now();
    if (now - lastRetryLog > RETRY_LOG_THROTTLE) {
      console.debug(`[getImageWithFallback] Attempting to load: ${url}`);
      lastRetryLog = now;
    }
  }
  
  return url;
}

/**
 * Mark a URL as failed so subsequent attempts return the placeholder.
 * Call this from an img onError handler.
 * Detects 503 errors and triggers server unavailable mode.
 */
export function markUrlAsFailed(url, httpStatus = null) {
  if (url) {
    failedUrls.add(url);
  }
  
  // Check for 503 status to detect server unavailability
  // If no status provided but URL is Audius content, count it as 503 (common failure)
  const status = httpStatus || (url && (url.includes('audius') || url.includes('bragi') || url.includes('altego')) ? 503 : null);
  
  if (status === 503) {
    const now = Date.now();
    
    // Reset counter if outside window
    if (now - last503FailureTime > FAILURE_WINDOW) {
      consecutive503Failures = 0;
    }
    last503FailureTime = now;
    consecutive503Failures++;
    
    // Check if we should enter unavailable mode
    if (consecutive503Failures >= FAILURE_THRESHOLD && !serverUnavailableMode) {
      serverUnavailableMode = true;
      console.warn('[audius] Audius content servers returning 503 errors. Entering fallback mode for all images.');
      
      // Auto-reset after window closes
      setTimeout(() => {
        serverUnavailableMode = false;
        consecutive503Failures = 0;
        console.info('[audius] Resuming normal image loading.');
      }, FAILURE_WINDOW);
    }
  }
}

/**
 * Check if server is in unavailable mode.
 */
export function isServerUnavailable() {
  return serverUnavailableMode;
}