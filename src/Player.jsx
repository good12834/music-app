import { useState, useRef, useEffect } from 'react';
import TrackArt from './TrackArt.jsx';
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, 
  Heart, Volume2, VolumeX, Share2, Download, ListMusic,
  SlidersHorizontal, Mic2, Radio, Clock, Maximize2,
  Minimize2, ExternalLink, Info, Share, ChevronUp, ChevronDown, Menu
} from 'lucide-react';
import { formatTime } from './data.jsx';
import Visualizer from './Visualizer.jsx';

export default function Player({ state, isCollapsed, isMobile }) {
  const {
    currentTrack, isPlaying, progress, duration, volume, shuffle, repeat, liked,
    setIsPlaying, setVolume, setShuffle, setRepeat, queue, addToQueue,
    handleNext, handlePrev, toggleLike, seek, analyserNode, playlist,
  } = state;

  const [showVolumeMenu, setShowVolumeMenu] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [crossfade, setCrossfade] = useState(0);
  const [sleepTimer, setSleepTimer] = useState(null);
  const [showEffects, setShowEffects] = useState(false);
  const volumeMenuRef = useRef(null);
  const queueRef = useRef(null);

  const dur = duration || currentTrack.duration;
  const pct = dur > 0 ? (progress / dur) * 100 : 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (volumeMenuRef.current && !volumeMenuRef.current.contains(event.target)) {
        setShowVolumeMenu(false);
      }
      if (queueRef.current && !queueRef.current.contains(event.target)) {
        setShowQueue(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const startSleepTimer = (minutes) => {
    if (sleepTimer) clearTimeout(sleepTimer);
    const timer = setTimeout(() => {
      setIsPlaying(false);
      setSleepTimer(null);
    }, minutes * 60 * 1000);
    setSleepTimer(timer);
  };

  const cancelSleepTimer = () => {
    if (sleepTimer) { clearTimeout(sleepTimer); setSleepTimer(null); }
  };

  const shareTrack = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: currentTrack.title, text: `${currentTrack.title} by ${currentTrack.artist}`, url: window.location.href });
      } catch (err) {}
    } else {
      navigator.clipboard?.writeText(`${currentTrack.title} - ${currentTrack.artist}`);
    }
  };

  const downloadTrack = () => {
    const link = document.createElement('a');
    link.href = currentTrack.audioUrl || '#';
    link.download = `${currentTrack.title}.mp3`;
    link.click();
  };

  // Mobile bottom player bar
  if (isMobile) {
    return (
      <>
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: 'var(--mobile-player-height)',
          background: 'var(--surface)', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
          zIndex: 100,
        }}>
          {/* Album Art */}
          <div style={{
            width: 48, height: 48, borderRadius: 6,
            background: currentTrack.color + '20',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <TrackArt track={currentTrack} isPlaying={isPlaying} size={40} />
          </div>

          {/* Track Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentTrack.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{currentTrack.artist}</div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setShowQueue(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4,
            }}>
              <ListMusic size={16} />
            </button>
            <button 
              onClick={() => setIsPlaying(p => !p)}
              style={{
                width: 36, height: 36, borderRadius: '50%', background: currentTrack.color,
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 12px ${currentTrack.color}66`, color: '#000',
              }}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 1 }} />}
            </button>
            <button onClick={handleNext} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4,
            }}>
              <SkipForward size={16} />
            </button>
          </div>
        </div>

        {/* Queue Mini-Panel */}
        {showQueue && (
          <div style={{
            position: 'fixed', bottom: 'calc(var(--mobile-player-height) + 8px)', right: 16,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, width: 280, maxHeight: 300, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Up Next</span>
              <button onClick={() => setShowQueue(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <ChevronDown size={14} />
              </button>
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {(playlist || queue || []).slice(0, 6).map((track, idx) => (
                <div key={idx} onClick={() => setShowQueue(false)} style={{
                  padding: '8px 14px', fontSize: 11, display: 'flex', justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border)', alignItems: 'center', cursor: 'pointer',
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{track.title}</span>
                  <span style={{ color: 'var(--muted)', flexShrink: 0, marginLeft: 8 }}>{track.artist}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop player sidebar
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 0,
      background: isExpanded ? 'rgba(0,0,0,0.95)' : 'var(--surface)',
      borderRight: '1px solid var(--border)',
      height: '100%', overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Mic2 size={14} color="var(--muted)" />
          <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 1 }}>NOW PLAYING</span>
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
          {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Visualizer */}
      <div style={{ height: isExpanded ? 120 : 80, padding: '0 24px', paddingTop: 16 }}>
        <Visualizer isPlaying={isPlaying} color={currentTrack.color} bpm={currentTrack.bpm} analyserNode={analyserNode} intensity={volume * 100} />
      </div>

      {/* Art + Info */}
      <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, cursor: 'pointer' }}
        onClick={() => setShowInfo(!showInfo)}>
        <div style={{
          position: 'relative',
          filter: isPlaying ? `drop-shadow(0 0 24px ${currentTrack.color}66)` : 'none',
          transition: 'filter 0.6s ease',
        }}>
          <TrackArt track={currentTrack} isPlaying={isPlaying} size={isExpanded ? 240 : 180} analyserNode={analyserNode} />
        </div>

        <div style={{ width: '100%', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: isExpanded ? 32 : 28, letterSpacing: 2,
            color: 'var(--text)', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{currentTrack.title}</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            {currentTrack.artist} — {currentTrack.album}
          </div>
          {showInfo && (
            <div style={{
              marginTop: 12, padding: 12, background: 'rgba(0,0,0,0.3)',
              borderRadius: 8, fontSize: 12, color: 'var(--muted)',
            }}>
              <div>Release: {currentTrack.year || '2024'}</div>
              <div>Label: {currentTrack.label || 'Independent'}</div>
              <div>Bitrate: {currentTrack.bitrate || '320'} kbps</div>
              <div>Sample Rate: 44.1 kHz</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={(e) => { e.stopPropagation(); toggleLike(currentTrack.id); }} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: liked.has(currentTrack.id) ? currentTrack.color : 'var(--muted)',
            transition: 'all 0.2s', transform: liked.has(currentTrack.id) ? 'scale(1.2)' : 'scale(1)',
          }}>
            <Heart size={18} fill={liked.has(currentTrack.id) ? 'currentColor' : 'none'} />
          </button>
          <span style={{
            background: currentTrack.color + '22', color: currentTrack.color,
            fontSize: 10, fontWeight: 500, letterSpacing: 1.5,
            padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase',
          }}>{currentTrack.genre}</span>
          <span style={{ color: 'var(--muted)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> {currentTrack.bpm} BPM
          </span>
          <span style={{ color: 'var(--muted)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ListMusic size={12} /> {currentTrack.key || 'C'}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: '0 24px' }}>
        <div
          onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - rect.left) / rect.width) * 100); }}
          style={{ height: 4, background: 'var(--border)', borderRadius: 2, cursor: 'pointer', position: 'relative' }}
        >
          <div style={{
            height: '100%', width: pct + '%', background: currentTrack.color, borderRadius: 2,
            transition: 'width 0.25s linear', boxShadow: `0 0 8px ${currentTrack.color}88`,
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: pct + '%', transform: 'translate(-50%, -50%)',
            width: 12, height: 12, borderRadius: '50%', background: currentTrack.color,
            boxShadow: `0 0 6px ${currentTrack.color}`,
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>{formatTime(progress)}</span>
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>{formatTime(dur)}</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '8px 24px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
          <CtrlBtn onClick={() => setShuffle(s => !s)} active={shuffle} color={currentTrack.color}><Shuffle size={16} /></CtrlBtn>
          <CtrlBtn onClick={handlePrev}><SkipBack size={20} /></CtrlBtn>
          <button
            onClick={() => setIsPlaying(p => !p)}
            style={{
              width: 52, height: 52, borderRadius: '50%', background: currentTrack.color,
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 20px ${currentTrack.color}66`, transition: 'all 0.2s', color: '#000',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 2 }} />}
          </button>
          <CtrlBtn onClick={handleNext}><SkipForward size={20} /></CtrlBtn>
          <CtrlBtn onClick={() => setRepeat(r => r === 'none' ? 'all' : r === 'all' ? 'one' : 'none')} active={repeat !== 'none'} color={currentTrack.color}>
            {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </CtrlBtn>
        </div>

        {/* Secondary Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4, position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <CtrlBtn onClick={() => setShowEffects(!showEffects)} active={showEffects} color={currentTrack.color}>
              <SlidersHorizontal size={14} />
            </CtrlBtn>
            {showEffects && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, padding: 10, zIndex: 1000, minWidth: 160,
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Speed</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                      <button key={s} onClick={() => setSpeed(s)} style={{
                        padding: '3px 6px', fontSize: 10,
                        background: speed === s ? currentTrack.color : 'transparent',
                        border: `1px solid ${currentTrack.color}66`, borderRadius: 4,
                        cursor: 'pointer', color: speed === s ? '#000' : 'var(--text)',
                        fontFamily: 'var(--font-body)',
                      }}>{s}x</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>Crossfade: {crossfade}s</div>
                  <input type="range" min="0" max="12" step="0.5" value={crossfade}
                    onChange={e => setCrossfade(+e.target.value)}
                    style={{ width: '100%', accentColor: currentTrack.color }} />
                </div>
              </div>
            )}
          </div>

          <CtrlBtn onClick={() => setShowQueue(!showQueue)} active={showQueue} color={currentTrack.color}>
            <ListMusic size={14} />
          </CtrlBtn>
          <CtrlBtn onClick={shareTrack}><Share size={14} /></CtrlBtn>
          <CtrlBtn onClick={downloadTrack}><Download size={14} /></CtrlBtn>
        </div>

        {/* Mini Queue Preview */}
        {showQueue && (
          <div ref={queueRef} style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, maxHeight: 180, overflowY: 'auto',
          }}>
            <div style={{ padding: '8px 12px', fontSize: 10, color: 'var(--muted)', borderBottom: '1px solid var(--border)', letterSpacing: 1, textTransform: 'uppercase' }}>
              Up Next · {playlist?.length || 0} tracks
            </div>
            {(playlist || queue || []).slice(0, 6).map((track, idx) => (
              <div key={idx} style={{
                padding: '6px 12px', fontSize: 11, display: 'flex', justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)', alignItems: 'center',
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{track.title}</span>
                <span style={{ color: 'var(--muted)', flexShrink: 0, marginLeft: 8 }}>{track.artist}</span>
              </div>
            ))}
          </div>
        )}

        {/* Volume */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
          <button onClick={() => { setShowVolumeMenu(!showVolumeMenu); setShowEffects(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <input type="range" min="0" max="1" step="0.01" value={volume}
            onChange={e => setVolume(+e.target.value)}
            style={{ flex: 1, accentColor: currentTrack.color, cursor: 'pointer' }} />
          <span style={{ fontSize: 10, color: 'var(--muted)', width: 28, textAlign: 'right' }}>
            {Math.round(volume * 100)}%
          </span>
          {sleepTimer && (
            <div style={{
              position: 'absolute', top: -24, right: 0,
              background: currentTrack.color, padding: '2px 8px',
              borderRadius: 4, fontSize: 10, color: '#000', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              🛌 active
              <button onClick={cancelSleepTimer} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#000', padding: 0 }}>✕</button>
            </div>
          )}
        </div>
      </div>

      {/* Sleep Timer Footer */}
      <div style={{
        padding: '8px 24px 12px', borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-around', marginTop: 'auto',
      }}>
        {[15, 30, 60].map(m => (
          <button key={m} onClick={() => startSleepTimer(m)} style={{
            background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
            fontSize: 10, display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: 'var(--font-body)',
          }}>🛌 {m}m</button>
        ))}
        <button onClick={cancelSleepTimer} style={{
          background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
          fontSize: 10, fontFamily: 'var(--font-body)',
        }}>Cancel</button>
      </div>
    </div>
  );
}

function CtrlBtn({ onClick, active, color, children }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: active ? color || 'var(--accent)' : 'var(--muted)',
      transition: 'all 0.15s', padding: 6, borderRadius: 6,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onMouseEnter={e => !active && (e.currentTarget.style.color = 'var(--text)')}
      onMouseLeave={e => !active && (e.currentTarget.style.color = 'var(--muted)')}
    >
      {children}
    </button>
  );
}