import { useState, useEffect, useCallback } from 'react';
import { Music, Library, ListMusic, Activity, Heart, Radio, Settings, ChevronLeft, ChevronRight, Maximize2, Minimize2, Menu, X } from 'lucide-react';
import { usePlayer } from './usePlayer.js';
import Player from './Player.jsx';
import LibraryView from './Library.jsx';
import Queue from './Queue.jsx';
import SettingsPanel from './Settings.jsx';
import RadioPanel from './Radio.jsx';
import { getTrendingTracks, searchTracks } from './getTrendingTracks.jsx';
import { getStreamUrl, getImageWithFallback, markUrlAsFailed } from './audius.js';
import './index.css';
import TrackArt from './TrackArt.jsx';

/**
 * Tiny self-contained thumbnail with built-in 503/error fallback.
 * Uses React state so it works regardless of DOM structure.
 */
function TrackThumb({ src, color, size = 30, radius = 4 }) {
  const [failed, setFailed] = useState(false);
  // Reset when the src changes (new track)
  useEffect(() => { setFailed(false); }, [src]);

  if (!src || failed) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius, flexShrink: 0,
        background: (color || '#6366f1') + '28',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid ' + (color || '#6366f1') + '44',
      }}>
        <Music size={Math.round(size * 0.45)} color={color || '#6366f1'} />
      </div>
    );
  }

  return (
    <img
      src={getImageWithFallback(src)}
      alt=""
      onError={() => {
        markUrlAsFailed(src, 503);
        setFailed(true);
      }}
      style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0, display: 'block' }}
    />
  );
}

export default function App() {
  const state = usePlayer();
  const [tab, setTab] = useState('discover');
  const [showSettings, setShowSettings] = useState(false);
  const [showRadio, setShowRadio] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [audiusTracks, setAudiusTracks] = useState([]);
  const [audiusLoading, setAudiusLoading] = useState(false);
  const [audiusSearchQuery, setAudiusSearchQuery] = useState('');
  const [audiusSearchResults, setAudiusSearchResults] = useState([]);
  const [audiusSearching, setAudiusSearching] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 767px)').matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { id: 'discover', icon: Activity,  label: 'Discover', color: '#4ecdc4' },
    { id: 'library',  icon: Library,   label: 'Library',  color: '#e8ff47' },
    { id: 'queue',    icon: ListMusic,  label: 'Queue',    color: '#ff6b6b' },
  ];

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const playAudiusTrack = (track) => {
    state.playTrack({ ...track, url: track.trackId ? getStreamUrl(track.trackId) : track.url });
  };

  // Load trending on mount
  useEffect(() => {
    let alive = true;
    setAudiusLoading(true);
    getTrendingTracks(30)
      .then(tracks => { if (alive) { setAudiusTracks(tracks); setAudiusLoading(false); } })
      .catch(() => { if (alive) setAudiusLoading(false); });
    return () => { alive = false; };
  }, []);

  // Debounced search
  useEffect(() => {
    if (audiusSearchQuery.trim().length < 2) { setAudiusSearchResults([]); return; }
    setAudiusSearching(true);
    const timer = setTimeout(() => {
      searchTracks(audiusSearchQuery)
        .then(r => { setAudiusSearchResults(r); setAudiusSearching(false); })
        .catch(() => setAudiusSearching(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [audiusSearchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const inInput = e.target.matches('input, textarea');
      if ((e.ctrlKey || e.metaKey)) {
        if (e.key === 'd') { e.preventDefault(); setTab('discover'); }
        if (e.key === 'l') { e.preventDefault(); setTab('library'); }
        if (e.key === 'q') { e.preventDefault(); setTab('queue'); }
        if (e.key === 's') { e.preventDefault(); setShowSettings(s => !s); }
        if (e.key === 'f') {
          e.preventDefault();
          if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(() => {}); setIsFullscreen(true); }
          else { document.exitFullscreen().catch(() => {}); setIsFullscreen(false); }
        }
      }
      if (!inInput) {
        if (e.code === 'Space')      { e.preventDefault(); state.setIsPlaying(p => !p); }
        if (e.code === 'ArrowRight') { e.preventDefault(); state.handleNext(); }
        if (e.code === 'ArrowLeft')  { e.preventDefault(); state.handlePrev(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Responsive player width
  const playerWidth = isMobile 
    ? '100%' 
    : (isCollapsed ? '72px' : '300px');

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: playerWidth + ' 1fr',
      height: '100vh',
      background: 'var(--bg)',
      overflow: 'hidden',
      transition: isMobile ? 'none' : 'grid-template-columns 0.3s ease',
    }}>
      {/* Left — Player (desktop sidebar or mobile hidden) */}
      {!isMobile && <Player state={state} isCollapsed={isCollapsed} />}

      {/* Right — Main content */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden', 
        minWidth: 0,
        paddingBottom: isMobile ? 'var(--mobile-player-height)' : '0',
      }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 20px', borderBottom: '1px solid var(--border)',
          background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(10px)',
          position: 'sticky', top: 0, zIndex: 100, flexShrink: 0,
        }}>
          {/* Mobile menu button */}
          {isMobile && (
            <button onClick={() => setShowMobileMenu(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', display: 'flex', padding: 4, borderRadius: 4, flexShrink: 0,
            }}>
              <Menu size={16} />
            </button>
          )}

          {/* Desktop collapse toggle */}
          {!isMobile && (
            <button onClick={() => setIsCollapsed(c => !c)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', display: 'flex', padding: 4, borderRadius: 4, flexShrink: 0,
            }}>
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'linear-gradient(135deg, var(--accent), #ff6b6b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Music size={14} color="#000" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: 2 }}>WAVESHAPE</span>
          </div>

          {/* Search - desktop */}
          {!isMobile && (
            <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
              <input
                value={audiusSearchQuery}
                onChange={e => setAudiusSearchQuery(e.target.value)}
                placeholder="Search Audius catalog…"
                style={{
                  width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 20, padding: '6px 14px', color: 'var(--text)',
                  fontSize: 12, outline: 'none', fontFamily: 'var(--font-body)',
                }}
              />
              {(audiusSearching || audiusSearchResults.length > 0 || (audiusSearchQuery.length >= 2 && !audiusSearching)) && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, overflow: 'hidden', zIndex: 200,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}>
                  {audiusSearching && (
                    <div style={{ padding: 12, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>Searching Audius…</div>
                  )}
                  <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                    {audiusSearchResults.map(track => (
                      <div key={track.id}
                        onClick={() => { playAudiusTrack(track); setAudiusSearchQuery(''); setAudiusSearchResults([]); }}
                        style={{
                          padding: '8px 14px', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <TrackThumb src={track.thumbnail} color={track.color} size={30} radius={4} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{track.artist}</div>
                        </div>
                      </div>
                    ))}
                    {audiusSearchQuery.length >= 2 && !audiusSearching && audiusSearchResults.length === 0 && (
                      <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>No results on Audius</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile search button */}
          {isMobile && (
            <button onClick={() => setShowSearchBar(true)} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
              color: 'var(--text)', flex: 1, maxWidth: 300,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4-4" />
              </svg>
              <span style={{ fontSize: 12 }}>Search Audius...</span>
            </button>
          )}

          {/* Nav tabs - desktop only */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {navItems.map(({ id, icon: Icon, label, color }) => (
                <button key={id} onClick={() => setTab(id)} style={{
                  background: tab === id ? color + '20' : 'none',
                  border: `1px solid ${tab === id ? color : 'transparent'}`,
                  color: tab === id ? color : 'var(--muted)',
                  borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
                  fontFamily: 'var(--font-body)',
                }}>
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>
          )}

          {/* Right actions */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <IconBtn active={showRadio}    onClick={() => setShowRadio(r => !r)}    accent><Radio size={13} /></IconBtn>
            <IconBtn active={showSettings} onClick={() => setShowSettings(s => !s)} accent><Settings size={13} /></IconBtn>
            <IconBtn onClick={() => {
              if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(() => {}); setIsFullscreen(true); }
              else { document.exitFullscreen().catch(() => {}); setIsFullscreen(false); }
            }}>
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </IconBtn>
          </div>
        </div>

        {/* Now-playing bar */}
        <div style={{
          padding: '7px 20px', flexShrink: 0,
          background: (state.currentTrack.color || '#6366f1') + '12',
          borderBottom: `1px solid ${(state.currentTrack.color || '#6366f1')}2a`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 4, flexShrink: 0,
            background: (state.currentTrack.color || '#6366f1') + '28',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Music size={13} color={state.currentTrack.color || '#6366f1'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: state.currentTrack.color || '#6366f1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {state.currentTrack.title}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{state.currentTrack.artist}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: state.currentTrack.color || '#6366f1',
              animation: state.isPlaying ? 'pulse 1s infinite' : 'none',
            }} />
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>{state.isPlaying ? 'Playing' : 'Paused'}</span>
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {tab === 'discover' && (
            <DiscoverView
              audiusTracks={audiusTracks}
              audiusLoading={audiusLoading}
              playAudiusTrack={playAudiusTrack}
              state={state}
            />
          )}
          {tab === 'library' && <LibraryView state={state} />}
          {tab === 'queue'   && <Queue state={state} />}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobile && showMobileMenu && (
        <>
          <div 
            onClick={() => setShowMobileMenu(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 400,
              background: 'rgba(0,0,0,0.5)',
            }}
          />
          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, width: 240,
            background: 'var(--surface)', borderRight: '1px solid var(--border)',
            zIndex: 500, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 2 }}>MENU</span>
              <button onClick={() => setShowMobileMenu(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '8px 0' }}>
              {navItems.map(({ id, icon: Icon, label, color }) => (
                <button key={id} onClick={() => { setTab(id); setShowMobileMenu(false); }} style={{
                  width: '100%', background: tab === id ? color + '20' : 'none',
                  border: `1px solid ${tab === id ? color : 'transparent'}`,
                  color: tab === id ? color : 'var(--muted)',
                  borderRadius: 0, padding: '12px 20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                  fontFamily: 'var(--font-body)',
                }}>
                  <Icon size={18} />
                  <span style={{ fontSize: 14 }}>{label}</span>
                </button>
              ))}
            </div>
            <div style={{ padding: '16px', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setShowSettings(true)} style={{
                width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px', cursor: 'pointer', color: 'var(--text)',
                marginBottom: 8,
              }}>
                Settings
              </button>
              <button onClick={() => setShowRadio(true)} style={{
                width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px', cursor: 'pointer', color: 'var(--text)',
              }}>
                Radio
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile Search Overlay */}
      {isMobile && showSearchBar && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, width: '100%', maxWidth: 400, padding: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>Search</span>
              <button onClick={() => setShowSearchBar(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>
            <input
              value={audiusSearchQuery}
              onChange={e => setAudiusSearchQuery(e.target.value)}
              placeholder="Search Audius catalog…"
              style={{
                width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px', color: 'var(--text)', fontSize: 14, outline: 'none',
              }}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {showSettings && <SettingsPanel state={state} onClose={() => setShowSettings(false)} addNotification={addNotification} />}
      {showRadio    && <RadioPanel    state={state} onClose={() => setShowRadio(false)}    addNotification={addNotification} />}

      {/* Toast notifications */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 600 }}>
        {notifications.map(n => (
          <div key={n.id} style={{
            background: n.type === 'success' ? '#22c55e22' : n.type === 'error' ? '#ef444422' : 'var(--surface)',
            border: `1px solid ${n.type === 'success' ? '#22c55e' : n.type === 'error' ? '#ef4444' : 'var(--border)'}`,
            color: n.type === 'success' ? '#22c55e' : n.type === 'error' ? '#ef4444' : 'var(--text)',
            padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            animation: 'slideIn 0.2s ease',
          }}>
            {n.message}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar       { width:5px;height:5px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:var(--border);border-radius:3px }
      `}</style>
    </div>
  );
}

// ── Shared icon button ─────────────────────────────────────────────────────────

function IconBtn({ onClick, active, accent, children }) {
  return (
    <button onClick={onClick} style={{
      background: active ? 'var(--accent)' : 'none',
      border: '1px solid var(--border)', borderRadius: 7,
      padding: 6, cursor: 'pointer',
      color: active ? '#000' : 'var(--muted)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s',
    }}>
      {children}
    </button>
  );
}

// ── Discover view ──────────────────────────────────────────────────────────────

function DiscoverView({ audiusTracks, audiusLoading, playAudiusTrack, state }) {
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [genreTracks, setGenreTracks] = useState([]);
  const [genreLoading, setGenreLoading] = useState(false);

  const genres = [
    { id: 'all',        label: 'Trending' },
    { id: 'Electronic', label: 'Electronic' },
    { id: 'Hip-Hop',    label: 'Hip-Hop' },
    { id: 'Rock',       label: 'Rock' },
    { id: 'R&B/Soul',   label: 'R&B' },
    { id: 'Latin',      label: 'Latin' },
    { id: 'Pop',        label: 'Pop' },
  ];

  useEffect(() => {
    if (selectedGenre === 'all') { setGenreTracks([]); return; }
    let alive = true;
    setGenreLoading(true);
    getTrendingTracks(30, selectedGenre)
      .then(t => { if (alive) { setGenreTracks(t); setGenreLoading(false); } })
      .catch(() => { if (alive) setGenreLoading(false); });
    return () => { alive = false; };
  }, [selectedGenre]);

  const displayTracks = selectedGenre === 'all' ? audiusTracks : genreTracks;
  const isLoading     = selectedGenre === 'all' ? audiusLoading : genreLoading;

  const addAllToQueue = () => {
    displayTracks.forEach(t => state.addToQueue({ ...t, url: t.trackId ? getStreamUrl(t.trackId) : t.url }));
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={20} color="#4ecdc4" />Discover on Audius
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Real tracks from the decentralized music catalog</p>
        </div>
        {displayTracks.length > 0 && (
          <button onClick={addAllToQueue} style={{
            background: 'var(--accent)', color: '#000', border: 'none',
            borderRadius: 20, padding: '7px 16px', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-body)',
          }}>+ Add All</button>
        )}
      </div>

      {/* Genre filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {genres.map(g => (
          <button key={g.id} onClick={() => setSelectedGenre(g.id)} style={{
            background: selectedGenre === g.id ? '#4ecdc428' : 'var(--surface2)',
            border: `1px solid ${selectedGenre === g.id ? '#4ecdc4' : 'var(--border)'}`,
            color: selectedGenre === g.id ? '#4ecdc4' : 'var(--muted)',
            borderRadius: 20, padding: '4px 14px', fontSize: 11,
            cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s',
            fontFamily: 'var(--font-body)',
          }}>{g.label}</button>
        ))}
      </div>

      {/* Track table */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#4ecdc4', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>Loading from Audius…</span>
        </div>
      ) : displayTracks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          <Music size={36} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p style={{ fontSize: 13 }}>No tracks found. Try a different genre.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {displayTracks.map((track, idx) => {
            const isActive = state.currentTrack.trackId === track.trackId || state.currentTrack.id === track.id;
            const mm = Math.floor((track.duration || 0) / 60);
            const ss = String(Math.floor((track.duration || 0) % 60)).padStart(2, '0');
            const plays = track.play_count >= 1000 ? (track.play_count / 1000).toFixed(1) + 'k' : (track.play_count || 0);
            return (
              <div key={track.id}
                onClick={() => playAudiusTrack(track)}
                style={{
                  display: 'grid', gridTemplateColumns: '32px 32px 1fr 90px 64px 44px 24px',
                  gap: 10, padding: '6px 10px', borderRadius: 7, cursor: 'pointer', alignItems: 'center',
                  background: isActive ? (track.color || '#4ecdc4') + '14' : 'transparent',
                  borderLeft: isActive ? `2px solid ${track.color || '#4ecdc4'}` : '2px solid transparent',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface2)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>{idx + 1}</span>
                <TrackThumb src={track.thumbnail} color={track.color} size={28} radius={3} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: isActive ? (track.color || '#4ecdc4') : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}</div>
                </div>
                <span style={{ padding: '2px 8px', borderRadius: 10, background: (track.color || '#4ecdc4') + '18', color: track.color || '#4ecdc4', fontSize: 10, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.genre}
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>{track.duration ? `${mm}:${ss}` : '--:--'}</span>
                <span style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center' }}>{plays}</span>
                <Heart size={13}
                  color={state.liked?.has(track.id) ? '#f43f5e' : 'var(--muted)'}
                  fill={state.liked?.has(track.id) ? '#f43f5e' : 'none'}
                  style={{ cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); state.toggleLike(track.id); }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

