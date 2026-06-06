import { useState, useEffect } from 'react';
import { X, Sliders, Palette, Keyboard, Info, Volume2, Zap, ChevronDown, ChevronUp } from 'lucide-react';

const THEMES = [
  { id: 'dark',    label: 'Dark',       bg: '#080808', accent: '#e8ff47' },
  { id: 'darker',  label: 'Midnight',   bg: '#020202', accent: '#47b3ff' },
  { id: 'warm',    label: 'Warm Dark',  bg: '#0d0906', accent: '#ffb347' },
  { id: 'purple',  label: 'Deep Space', bg: '#06040d', accent: '#b347ff' },
];

export default function SettingsPanel({ state, onClose, addNotification }) {
  const { equalizer, setEqualizerBand, crossfadeDuration, setCrossfadeDuration, playbackRate, setPlaybackRate } = state;
  const [activeTab, setActiveTab] = useState('audio');
  const [theme, setTheme] = useState('dark');
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 767px)').matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const applyTheme = (t) => {
    setTheme(t.id);
    document.documentElement.style.setProperty('--bg',     t.bg);
    document.documentElement.style.setProperty('--accent', t.accent);
    addNotification?.(`Theme changed to ${t.label}`, 'success');
  };

  const EQBand = ({ label, band, min = -12, max = 12 }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ position: 'relative', height: isMobile ? 80 : 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <input
          type="range" min={min} max={max} step="0.5"
          value={equalizer?.[band] ?? 0}
          onChange={e => setEqualizerBand?.(band, +e.target.value)}
          style={{ writingMode: 'vertical-lr', direction: 'rtl', width: 24, height: isMobile ? 70 : 110, accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
      </div>
      <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
        {(equalizer?.[band] ?? 0) > 0 ? '+' : ''}{(equalizer?.[band] ?? 0).toFixed(1)} dB
      </div>
    </div>
  );

  const tabs = [
    { id: 'audio',    icon: Volume2, label: 'Audio' },
    { id: 'appearance', icon: Palette, label: 'Theme' },
    { id: 'shortcuts', icon: Keyboard, label: 'Keys' },
    { id: 'about',    icon: Info,    label: 'About' },
  ];

  // Mobile: bottom sheet layout
  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end',
      }} onClick={onClose}>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
          width: '100%', maxHeight: '80vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }} onClick={e => e.stopPropagation()}>
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
            <div style={{ width: 32, height: 4, background: 'var(--border)', borderRadius: 2, opacity: 0.5 }} />
          </div>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders size={16} color="var(--accent)" />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 1 }}>SETTINGS</span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
              <X size={18} />
            </button>
          </div>

          {/* Mobile Tab Bar */}
          <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
            {tabs.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                flex: 1, background: activeTab === id ? 'var(--accent)' : 'var(--surface)',
                color: activeTab === id ? '#000' : 'var(--muted)',
                border: 'none', padding: '10px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {activeTab === 'audio' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Zap size={14} color="var(--accent)" /> Equalizer
                  </div>
                  <div style={{ display: 'flex', gap: 8, background: 'var(--surface2)', borderRadius: 10, padding: '12px', justifyContent: 'center' }}>
                    <EQBand label="Bass"   band="bass" />
                    <EQBand label="Mid"    band="mid" />
                    <EQBand label="Treble" band="treble" />
                  </div>
                  <button onClick={() => { setEqualizerBand?.('bass', 0); setEqualizerBand?.('mid', 0); setEqualizerBand?.('treble', 0); }}
                    style={{ marginTop: 8, background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                    Reset EQ
                  </button>
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Playback Speed</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                      <button key={s} onClick={() => setPlaybackRate?.(s)} style={{
                        padding: '6px 12px', fontSize: 12, borderRadius: 8,
                        background: playbackRate === s ? 'var(--accent)' : 'var(--surface2)',
                        border: `1px solid ${playbackRate === s ? 'var(--accent)' : 'var(--border)'}`,
                        color: playbackRate === s ? '#000' : 'var(--text)',
                        cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600,
                      }}>{s}×</button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Crossfade</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{crossfadeDuration ?? 0}s</span>
                  </div>
                  <input type="range" min="0" max="12" step="0.5" value={crossfadeDuration ?? 0}
                    onChange={e => setCrossfadeDuration?.(+e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                    <span>Off</span><span>12s</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Color Theme</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {THEMES.map(t => (
                      <button key={t.id} onClick={() => applyTheme(t)} style={{
                        background: t.bg, border: `2px solid ${theme === t.id ? t.accent : 'var(--border)'}`,
                        borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: t.accent }} />
                        <span style={{ color: t.accent, fontSize: 12, fontWeight: 600 }}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Keyboard Shortcuts</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['Space',    'Play / Pause'],
                    ['← →',      'Previous / Next track'],
                    ['Ctrl+D',   'Discover tab'],
                    ['Ctrl+L',   'Library tab'],
                    ['Ctrl+Q',   'Queue tab'],
                    ['Ctrl+S',   'Toggle Settings'],
                    ['Ctrl+F',   'Toggle Fullscreen'],
                  ].map(([key, desc]) => (
                    <div key={key} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8,
                    }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</span>
                      <kbd style={{
                        background: 'var(--border)', color: 'var(--text)',
                        padding: '3px 8px', borderRadius: 5, fontSize: 11,
                        fontFamily: 'monospace', border: '1px solid #333',
                      }}>{key}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '20px 0' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: 'linear-gradient(135deg, var(--accent), #ff6b6b)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#000' }}>W</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 3 }}>WAVESHAPE</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>v2.0.0 — React + Vite</div>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', lineHeight: 1.7, maxWidth: 320 }}>
                  Full-stack music player with real-time audio visualization, Web Audio API equalizer, and live streaming from the Audius decentralized music network.
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['React 18', 'Vite', 'Web Audio API', 'Audius', 'Canvas 2D'].map(tag => (
                    <span key={tag} style={{ background: 'var(--accent)22', color: 'var(--accent)', fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop modal
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, width: 520, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={16} color="var(--accent)" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 2 }}>SETTINGS</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
          {tabs.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              background: activeTab === id ? 'var(--accent)' : 'var(--surface2)',
              color: activeTab === id ? '#000' : 'var(--muted)',
              border: 'none', borderRadius: 8, padding: '6px 12px',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-body)',
            }}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {activeTab === 'audio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* EQ */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={14} color="var(--accent)" /> Equalizer
                </div>
                <div style={{ display: 'flex', gap: 12, background: 'var(--surface2)', borderRadius: 10, padding: '16px 20px' }}>
                  <EQBand label="Bass"   band="bass" />
                  <EQBand label="Mid"    band="mid" />
                  <EQBand label="Treble" band="treble" />
                </div>
                <button onClick={() => { setEqualizerBand?.('bass', 0); setEqualizerBand?.('mid', 0); setEqualizerBand?.('treble', 0); }}
                  style={{ marginTop: 8, background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Reset EQ
                </button>
              </div>

              {/* Playback Speed */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Playback Speed</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(s => (
                    <button key={s} onClick={() => setPlaybackRate?.(s)} style={{
                      padding: '6px 12px', fontSize: 12, borderRadius: 8,
                      background: playbackRate === s ? 'var(--accent)' : 'var(--surface2)',
                      border: `1px solid ${playbackRate === s ? 'var(--accent)' : 'var(--border)'}`,
                      color: playbackRate === s ? '#000' : 'var(--text)',
                      cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600,
                    }}>{s}×</button>
                  ))}
                </div>
              </div>

              {/* Crossfade */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Crossfade</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{crossfadeDuration ?? 0}s</span>
                </div>
                <input type="range" min="0" max="12" step="0.5" value={crossfadeDuration ?? 0}
                  onChange={e => setCrossfadeDuration?.(+e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                  <span>Off</span><span>12s</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Color Theme</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => applyTheme(t)} style={{
                      background: t.bg, border: `2px solid ${theme === t.id ? t.accent : 'var(--border)'}`,
                      borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: t.accent }} />
                      <span style={{ color: t.accent, fontSize: 12, fontWeight: 600 }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Keyboard Shortcuts</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['Space',    'Play / Pause'],
                  ['← →',      'Previous / Next track'],
                  ['Ctrl+D',   'Discover tab'],
                  ['Ctrl+L',   'Library tab'],
                  ['Ctrl+Q',   'Queue tab'],
                  ['Ctrl+S',   'Toggle Settings'],
                  ['Ctrl+F',   'Toggle Fullscreen'],
                ].map(([key, desc]) => (
                  <div key={key} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8,
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</span>
                    <kbd style={{
                      background: 'var(--border)', color: 'var(--text)',
                      padding: '3px 8px', borderRadius: 5, fontSize: 11,
                      fontFamily: 'monospace', border: '1px solid #333',
                    }}>{key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '20px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'linear-gradient(135deg, var(--accent), #ff6b6b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#000' }}>W</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 3 }}>WAVESHAPE</div>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>v2.0.0 — React + Vite</div>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', lineHeight: 1.7, maxWidth: 320 }}>
                Full-stack music player with real-time audio visualization, Web Audio API equalizer, and live streaming from the Audius decentralized music network.
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['React 18', 'Vite', 'Web Audio API', 'Audius', 'Canvas 2D'].map(tag => (
                  <span key={tag} style={{ background: 'var(--accent)22', color: 'var(--accent)', fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}