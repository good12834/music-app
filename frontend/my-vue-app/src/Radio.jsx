import { useState, useEffect } from 'react';
import { X, Radio, Play, Loader, Signal, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTrendingTracks } from './getTrendingTracks.jsx';
import { getStreamUrl, getImageWithFallback, markUrlAsFailed } from './audius.js';

// Curated genre "stations" — each streams live trending Audius tracks for that genre
const STATIONS = [
  { id: 'electronic', label: 'Electronic Pulse', genre: 'Electronic', color: '#e8ff47', icon: '⚡' },
  { id: 'hiphop',     label: 'Hip-Hop Central',  genre: 'Hip-Hop',    color: '#ff4747', icon: '🎤' },
  { id: 'ambient',    label: 'Deep Focus',        genre: 'Ambient',    color: '#47b3ff', icon: '🌊' },
  { id: 'rock',       label: 'Rock Frequency',    genre: 'Rock',       color: '#ff8a47', icon: '🎸' },
  { id: 'rnb',        label: 'R&B Vibes',         genre: 'R&B/Soul',   color: '#ff47e8', icon: '🎶' },
  { id: 'pop',        label: 'Pop Hits',          genre: 'Pop',        color: '#47ffe8', icon: '✨' },
  { id: 'latin',      label: 'Latin Heat',        genre: 'Latin',      color: '#ffb347', icon: '🔥' },
  { id: 'experimental', label: 'Avant Garde',     genre: 'Experimental', color: '#b347ff', icon: '🔬' },
];

export default function RadioPanel({ state, onClose, addNotification }) {
  const [activeStation, setActiveStation] = useState(null);
  const [stationTracks, setStationTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [stationScroll, setStationScroll] = useState(0);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 767px)').matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tuneIn = async (station) => {
    setActiveStation(station);
    setLoading(true);
    try {
      const tracks = await getTrendingTracks(20, station.genre);
      setStationTracks(tracks);
      if (autoplay && tracks.length > 0) {
        const enriched = tracks.map(t => ({ ...t, url: t.trackId ? getStreamUrl(t.trackId) : t.url }));
        state.setQueue(enriched);
        state.setCurrentIndex(0);
        state.setIsPlaying(true);
        addNotification?.(`📻 Tuned into ${station.label}`, 'success');
      }
    } catch {
      addNotification?.('Failed to load station', 'error');
    }
    setLoading(false);
  };

  const playStationTrack = (track, idx) => {
    const enriched = stationTracks.map(t => ({ ...t, url: t.trackId ? getStreamUrl(t.trackId) : t.url }));
    state.setQueue(enriched);
    state.setCurrentIndex(idx);
    state.setIsPlaying(true);
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(4px)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Radio size={16} color="#4ecdc4" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 1 }}>RADIO</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <X size={18} />
          </button>
        </div>

        {!activeStation ? (
          // Station list
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {STATIONS.map(station => (
              <button key={station.id} onClick={() => tuneIn(station)} style={{
                width: '100%', background: activeStation?.id === station.id ? station.color + '18' : 'none',
                border: 'none', borderLeft: `3px solid ${activeStation?.id === station.id ? station.color : 'transparent'}`,
                cursor: 'pointer', padding: '14px 16px', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 24 }}>{station.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: activeStation?.id === station.id ? station.color : 'var(--text)' }}>
                    {station.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{station.genre}</div>
                </div>
              </button>
            ))}
          </div>
        ) : loading ? (
          // Loading
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid var(--border)`, borderTopColor: activeStation.color, animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>Loading {activeStation.label}…</span>
          </div>
        ) : (
          // Track list
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Station header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: activeStation.color + '0d' }}>
              <button onClick={() => setActiveStation(null)} style={{
                display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8,
              }}>
                <ChevronLeft size={16} color={activeStation.color} />
                <span style={{ fontSize: 12, color: activeStation.color, fontWeight: 600 }}>Back</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28 }}>{activeStation.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: activeStation.color }}>{activeStation.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{stationTracks.length} tracks · Live from Audius</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Signal size={12} color={activeStation.color} />
                  <span style={{ fontSize: 10, color: activeStation.color, fontWeight: 600 }}>LIVE</span>
                </div>
              </div>
            </div>
            
            {/* Track list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {stationTracks.map((track, idx) => {
                const isCurrent = state.currentTrack.trackId === track.trackId;
                return (
                  <div key={track.id} onClick={() => playStationTrack(track, idx)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                    cursor: 'pointer', background: isCurrent ? activeStation.color + '15' : 'transparent',
                    borderLeft: isCurrent ? `2px solid ${activeStation.color}` : '2px solid transparent',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'var(--surface2)'; }}
                    onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                  >
<span style={{ width: 20, fontSize: 11, color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>{idx + 1}</span>
                        {track.thumbnail
                          ? <div style={{ position: 'relative', width: 32, height: 32, borderRadius: 4, flexShrink: 0 }}>
                               <img src={getImageWithFallback(track.thumbnail)} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
onError={e => {
                                    markUrlAsFailed(track.thumbnail, 503);
                                    e.target.style.display = 'none';
                                    e.target.parentElement.querySelector('.thumb-fallback').style.display = 'flex';
                                  }}
                               />
                               <div className="thumb-fallback" style={{ width: 32, height: 32, borderRadius: 4, background: activeStation.color + '22', display: 'none', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'absolute', top: 0, left: 0 }}><span style={{ fontSize: 14 }}>{activeStation.icon}</span></div>
                             </div>
                          : null
                        }
                        {!track.thumbnail && <div style={{ width: 32, height: 32, borderRadius: 4, background: activeStation.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: 14 }}>{activeStation.icon}</span></div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: isCurrent ? activeStation.color : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{track.artist}</div>
                        </div>
                        <Play size={12} color={isCurrent ? activeStation.color : 'var(--muted)'} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, width: 640, maxHeight: '82vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Radio size={16} color="#4ecdc4" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 2 }}>RADIO</span>
            <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>Live from Audius</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={autoplay} onChange={e => setAutoplay(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
              Autoplay on tune-in
            </label>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Station list */}
          <div style={{ width: 220, borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '8px 0' }}>
            {STATIONS.map(station => (
              <button key={station.id} onClick={() => tuneIn(station)} style={{
                width: '100%', background: activeStation?.id === station.id ? station.color + '18' : 'none',
                border: 'none', borderLeft: `3px solid ${activeStation?.id === station.id ? station.color : 'transparent'}`,
                cursor: 'pointer', padding: '12px 16px', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 10,
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 20 }}>{station.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: activeStation?.id === station.id ? station.color : 'var(--text)' }}>
                    {station.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{station.genre}</div>
                </div>
                {activeStation?.id === station.id && (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }}>
                    {[0.6, 1, 0.75].map((h, i) => (
                      <div key={i} style={{
                        width: 3, background: station.color, borderRadius: 1,
                        height: 14 * h,
                        animation: `waveBar${i} 0.6s ease-in-out infinite alternate`,
                      }} />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Station content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {!activeStation ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, color: 'var(--muted)' }}>
                <Globe size={40} style={{ opacity: 0.3 }} />
                <div style={{ fontSize: 13, textAlign: 'center' }}>
                  Select a station to start streaming<br />
                  <span style={{ fontSize: 11 }}>Powered by Audius decentralized network</span>
                </div>
              </div>
            ) : loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid var(--border)`, borderTopColor: activeStation.color, animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>Loading {activeStation.label}…</span>
              </div>
            ) : (
              <>
                {/* Station header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: activeStation.color + '0d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 28 }}>{activeStation.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: activeStation.color }}>{activeStation.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{stationTracks.length} tracks · Live from Audius</div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Signal size={12} color={activeStation.color} />
                      <span style={{ fontSize: 10, color: activeStation.color, fontWeight: 600 }}>LIVE</span>
                    </div>
                  </div>
                </div>
                {/* Track list */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {stationTracks.map((track, idx) => {
                    const isCurrent = state.currentTrack.trackId === track.trackId;
                    return (
                      <div key={track.id} onClick={() => playStationTrack(track, idx)} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px',
                        cursor: 'pointer', background: isCurrent ? activeStation.color + '15' : 'transparent',
                        borderLeft: isCurrent ? `2px solid ${activeStation.color}` : '2px solid transparent',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'var(--surface2)'; }}
                        onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                      >
<span style={{ width: 20, fontSize: 11, color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>{idx + 1}</span>
                        {track.thumbnail
                          ? <div style={{ position: 'relative', width: 32, height: 32, borderRadius: 4, flexShrink: 0 }}>
                               <img src={getImageWithFallback(track.thumbnail)} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
onError={e => {
                                    markUrlAsFailed(track.thumbnail, 503);
                                    e.target.style.display = 'none';
                                    e.target.parentElement.querySelector('.thumb-fallback').style.display = 'flex';
                                  }}
                               />
                               <div className="thumb-fallback" style={{ width: 32, height: 32, borderRadius: 4, background: activeStation.color + '22', display: 'none', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'absolute', top: 0, left: 0 }}><span style={{ fontSize: 14 }}>{activeStation.icon}</span></div>
                             </div>
                          : null
                        }
                        {!track.thumbnail && <div style={{ width: 32, height: 32, borderRadius: 4, background: activeStation.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: 14 }}>{activeStation.icon}</span></div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: isCurrent ? activeStation.color : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{track.artist}</div>
                        </div>
                        <Play size={12} color={isCurrent ? activeStation.color : 'var(--muted)'} />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}