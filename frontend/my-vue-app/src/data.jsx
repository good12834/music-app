const PALETTE = ['#e8ff47','#47b3ff','#ff4747','#ff47e8','#47ffe8','#ffb347','#b347ff','#47ff8a','#ff8a47'];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

export function normalizeAudius(t) {
  return {
    id: t.id,
    trackId: t.id,
    title:   t.title   || 'Unknown Title',
    artist:  t.user?.name || 'Unknown Artist',
    album:   t.album   || '',
    genre:   t.genre   || 'Other',
    duration: t.duration || 180,
    year:    t.release_date ? new Date(t.release_date).getFullYear() : 2024,
    bpm:     t.bpm     || 120,
    color:   PALETTE[hashStr(t.id) % PALETTE.length],
    label:   t.user?.name || '',
    key:     t.musical_key || '',
    thumbnail: t.artwork?.['480x480'] || t.artwork?.['150x150'] || null,
    play_count: t.play_count || 0,
  };
}

// Static fallback tracks — each has a real Audius trackId so they can stream audio
export const TRACKS = [
  {
    id: 'v27mjE6',
    trackId: 'v27mjE6',
    title: "Hate Being Sober (Neotek Flip)",
    artist: "NEOTEK",
    album: "Singles",
    genre: "Dubstep",
    duration: 198,
    year: 2026,
    color: "#e8ff47",
    bpm: 140,
  },
  {
    id: '31Jyo9q',
    trackId: '31Jyo9q',
    title: "RAIVA",
    artist: "NAZAAR",
    album: "Singles",
    genre: "Trap",
    duration: 164,
    year: 2026,
    color: "#47b3ff",
    bpm: 130,
  },
  {
    id: 'JEPgQZk',
    trackId: 'JEPgQZk',
    title: "It's Not Really Funny",
    artist: "Connor Price",
    album: "Singles",
    genre: "Hip-Hop",
    duration: 144,
    year: 2026,
    color: "#ff4747",
    bpm: 140,
  },
  {
    id: 'G56Kw7j',
    trackId: 'G56Kw7j',
    title: "You Are The Knife",
    artist: "G L A D K I L L",
    album: "Singles",
    genre: "Future Bass",
    duration: 228,
    year: 2026,
    color: "#ff47e8",
    bpm: 130,
  },
  {
    id: 'BazlVJY',
    trackId: 'BazlVJY',
    title: "Toxic (Kill Your Utopia Remix)",
    artist: "Kill Your Utopia",
    album: "Remixes",
    genre: "Electronic",
    duration: 209,
    year: 2026,
    color: "#47ffe8",
    bpm: 143,
  },
  {
    id: 'm7Rjk6w',
    trackId: 'm7Rjk6w',
    title: "El Consejo",
    artist: "Mizter Bonezz",
    album: "Singles",
    genre: "Latin",
    duration: 152,
    year: 2026,
    color: "#ffb347",
    bpm: 88,
  },
  {
    id: 'AbGOxw0',
    trackId: 'AbGOxw0',
    title: "Cuando Me Dira (KEEL rmx)",
    artist: "KEEL",
    album: "Remixes",
    genre: "Electronic",
    duration: 147,
    year: 2026,
    color: "#b347ff",
    bpm: 87,
  },
  {
    id: '3vq8w1J',
    trackId: '3vq8w1J',
    title: "Crescendo (Michael Mason Remix)",
    artist: "michael mason",
    album: "Remixes",
    genre: "Electronic",
    duration: 150,
    year: 2026,
    color: "#47ff8a",
    bpm: 134,
  },
];

export const PLAYLISTS = [
  { id: 1, name: "Heavy Hitters", tracks: ['v27mjE6', '31Jyo9q', 'JEPgQZk'], color: "#ff4747" },
  { id: 2, name: "Chill Vibes", tracks: ['G56Kw7j', 'BazlVJY', '3vq8w1J'], color: "#47b3ff" },
  { id: 3, name: "Global Beats", tracks: ['m7Rjk6w', 'AbGOxw0'], color: "#ff47e8" },
];

export const formatTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};
