import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Play, Heart, Plus, ListMusic, Clock, X, Filter, 
  Grid3x3, List, Music, Mic2, Calendar, TrendingUp, 
  Shuffle, Download, Share2, MoreVertical, Check,
  ChevronDown, ChevronUp, Zap, Pause
} from 'lucide-react';
import { TRACKS, PLAYLISTS, formatTime } from './data.jsx';

export default function Library({ state }) {
  const { 
    currentTrack, isPlaying, playTrack, liked, toggleLike, 
    setQueue, setCurrentIndex, addToQueue, recentlyPlayed = [],
    mostPlayed = [], createPlaylist, addToPlaylist
  } = state;
  
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('tracks');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [layout, setLayout] = useState('list');
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedTracks, setSelectedTracks] = useState(new Set());
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [hoveredTrack, setHoveredTrack] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 767px)').matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const genres = ['all', ...new Set(TRACKS.map(t => t.genre))];

  const getTracksForView = () => {
    switch(view) {
      case 'liked':
        return TRACKS.filter(t => liked.has(t.id));
      case 'recent':
        return recentlyPlayed.map(id => TRACKS.find(t => t.id === id)).filter(Boolean);
      case 'top':
        return [...TRACKS].sort((a, b) => (mostPlayed[b.id] || 0) - (mostPlayed[a.id] || 0)).slice(0, 20);
      default:
        return TRACKS;
    }
  };

  const tracks = useMemo(() => {
    let filtered = getTracksForView();
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        t.genre.toLowerCase().includes(q)
      );
    }
    
    if (view === 'tracks' && filter !== 'all') {
      filtered = filtered.filter(t => t.genre === filter);
    }
    
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'duration') {
        aVal = a.duration;
        bVal = b.duration;
      } else if (sortBy === 'plays') {
        aVal = mostPlayed[a.id] || 0;
        bVal = mostPlayed[b.id] || 0;
      } else if (sortBy === 'recent') {
        aVal = recentlyPlayed.indexOf(a.id);
        bVal = recentlyPlayed.indexOf(b.id);
        if (aVal === -1) aVal = Infinity;
        if (bVal === -1) bVal = Infinity;
      }
      
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    return filtered;
  }, [view, search, filter, sortBy, sortOrder, liked, recentlyPlayed, mostPlayed]);

  const playAll = () => {
    if (tracks.length) { 
      setQueue(tracks); 
      setCurrentIndex(0); 
      state.setIsPlaying(true); 
    }
  };

  const shuffleAll = () => {
    if (tracks.length) {
      const shuffled = [...tracks];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setQueue(shuffled);
      setCurrentIndex(0);
      state.setIsPlaying(true);
    }
  };

  const addAllToQueue = () => {
    tracks.forEach(track => addToQueue(track));
  };

  const toggleSelectTrack = (trackId) => {
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId);
    } else {
      newSelected.add(trackId);
    }
    setSelectedTracks(newSelected);
    setShowBatchActions(newSelected.size > 0);
  };

  const selectAll = () => {
    if (selectedTracks.size === tracks.length) {
      setSelectedTracks(new Set());
      setShowBatchActions(false);
    } else {
      setSelectedTracks(new Set(tracks.map(t => t.id)));
      setShowBatchActions(true);
    }
  };

  const batchAddToQueue = () => {
    const selectedTracksList = TRACKS.filter(t => selectedTracks.has(t.id));
    selectedTracksList.forEach(track => addToQueue(track));
    setSelectedTracks(new Set());
    setShowBatchActions(false);
  };

  const batchAddToPlaylist = (playlistId) => {
    selectedTracks.forEach(trackId => addToPlaylist(trackId, playlistId));
    setSelectedTracks(new Set());
    setShowBatchActions(false);
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName);
      setNewPlaylistName('');
      setShowCreatePlaylist(false);
    }
  };

  const exportToJSON = () => {
    const data = {
      tracks: tracks.map(t => ({ id: t.id, title: t.title, artist: t.artist })),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: TRACKS.length,
    liked: liked.size,
    totalDuration: TRACKS.reduce((a, t) => a + t.duration, 0),
    genres: new Set(TRACKS.map(t => t.genre)).size,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--surface)' }}>
      {/* Header */}
      <div style={{ padding: isMobile ? '16px 16px 8px' : '20px 20px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 20 : 22, letterSpacing: 2 }}>LIBRARY</h2>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {stats.total} tracks • {stats.genres} genres • {stats.liked} liked
            </div>
          </div>
          {!isMobile && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={exportToJSON} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 10,
              }}>
                Export
              </button>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  ['tracks', '🎵'], 
                  ['playlists', '📋'], 
                  ['liked', '❤️'], 
                  ['recent', '🕐'], 
                  ['top', '🔥']
                ].map(([v, icon]) => (
                  <button key={v} onClick={() => setView(v)} style={{
                    background: view === v ? 'var(--accent)' : 'var(--surface2)',
                    color: view === v ? '#000' : 'var(--muted)',
                    border: 'none', cursor: 'pointer', borderRadius: 6,
                    padding: '4px 10px', fontSize: 11, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                    fontFamily: 'var(--font-body)',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <span>{icon}</span>
                    <span>{v}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile view selector */}
        {isMobile && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              ['tracks', '🎵'], 
              ['playlists', '📋'], 
              ['liked', '❤️'], 
              ['recent', '🕐'], 
              ['top', '🔥']
            ].map(([v, icon]) => (
              <button key={v} onClick={() => setView(v)} style={{
                background: view === v ? 'var(--accent)' : 'var(--surface2)',
                color: view === v ? '#000' : 'var(--muted)',
                border: 'none', cursor: 'pointer', borderRadius: 6,
                padding: '6px 10px', fontSize: 11, fontWeight: 600,
                fontFamily: 'var(--font-body)', flexShrink: 0,
              }}>
                {v}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? 'auto' : 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isMobile ? "Search..." : "Search tracks, artists, albums..."}
              style={{
                width: '100%', background: 'var(--surface2)',
                border: '1px solid var(--border)', borderRadius: 8,
                padding: isMobile ? '6px 8px 6px 32px' : '8px 12px 8px 32px', color: 'var(--text)',
                fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
              }}>
                <X size={12} />
              </button>
            )}
          </div>
        
          {!isMobile && (
            <>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 6, padding: '6px 8px', fontSize: 11, color: 'var(--text)',
                }}
              >
                <option value="title">Sort by Title</option>
                <option value="artist">Sort by Artist</option>
                <option value="duration">Sort by Duration</option>
                <option value="plays">Sort by Plays</option>
                <option value="recent">Sort by Recent</option>
              </select>
            
              <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '6px 8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}>
                {sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            
              <button onClick={() => setLayout(l => l === 'list' ? 'grid' : 'list')} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '6px 8px', cursor: 'pointer',
              }}>
                {layout === 'list' ? <Grid3x3 size={12} /> : <List size={12} />}
              </button>
            </>
          )}
        </div>

        {view === 'tracks' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {genres.map(g => (
              <button key={g} onClick={() => setFilter(g)} style={{
                background: filter === g ? 'var(--surface2)' : 'none',
                border: `1px solid ${filter === g ? 'var(--accent)' : 'var(--border)'}`,
                color: filter === g ? 'var(--accent)' : 'var(--muted)',
                borderRadius: 20, padding: '2px 10px', fontSize: 11,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                textTransform: 'capitalize',
              }}>{g}</button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {view === 'playlists' ? (
          <PlaylistView 
            playlists={PLAYLISTS} 
            state={state} 
            TRACKS={TRACKS}
            onAddToPlaylist={batchAddToPlaylist}
          />
        ) : layout === 'grid' ? (
          <GridView
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlay={playTrack}
            onLike={toggleLike}
            liked={liked}
            hoveredTrack={hoveredTrack}
            setHoveredTrack={setHoveredTrack}
            isMobile={isMobile}
          />
        ) : (
          <ListView
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlay={playTrack}
            onLike={toggleLike}
            liked={liked}
            selectedTracks={selectedTracks}
            onSelectTrack={toggleSelectTrack}
            hoveredTrack={hoveredTrack}
            setHoveredTrack={setHoveredTrack}
            isMobile={isMobile}
          />
        )}
      </div>

      {/* Create Playlist Modal */}
      {showCreatePlaylist && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 2000,
        }} onClick={() => setShowCreatePlaylist(false)}>
          <div style={{
            background: 'var(--surface)', padding: 24, borderRadius: 12,
            width: 320, border: '1px solid var(--border)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16, fontSize: 18 }}>Create Playlist</h3>
            <input
              autoFocus
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              style={{
                width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 12px', marginBottom: 20, color: 'var(--text)',
              }}
              onKeyPress={e => e.key === 'Enter' && handleCreatePlaylist()}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreatePlaylist(false)} style={{
                padding: '6px 16px', background: 'none', border: '1px solid var(--border)',
                borderRadius: 6, cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button onClick={handleCreatePlaylist} style={{
                padding: '6px 16px', background: 'var(--accent)', border: 'none',
                borderRadius: 6, cursor: 'pointer', fontWeight: 600,
              }}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ListView({ tracks, currentTrack, isPlaying, onPlay, onLike, liked, selectedTracks, onSelectTrack, hoveredTrack, setHoveredTrack, isMobile }) {
  if (isMobile) {
    return (
      <div>
        {tracks.map((track, i) => (
          <div
            key={track.id}
            onMouseEnter={() => setHoveredTrack(track.id)}
            onMouseLeave={() => setHoveredTrack(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px',
              background: currentTrack.id === track.id ? track.color + '12' : (hoveredTrack === track.id ? 'var(--surface2)' : 'transparent'),
              borderLeft: currentTrack.id === track.id ? `2px solid ${track.color}` : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onDoubleClick={() => onPlay(track)}
          >
            <div style={{ width: 40, height: 40, borderRadius: 6, background: track.color + '20', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {hoveredTrack === track.id || currentTrack.id === track.id ? (
                <button onClick={(e) => { e.stopPropagation(); onPlay(track); }} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: currentTrack.id === track.id ? track.color : 'var(--text)', padding: 0,
                }}>
                  {isPlaying && currentTrack.id === track.id ? (
                    <Bars color={track.color} />
                  ) : (
                    <Play size={14} fill="currentColor" />
                  )}
                </button>
              ) : (
                <span style={{ color: 'var(--muted)', fontSize: 11 }}>{i + 1}</span>
              )}
            </div>
          
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 500, color: currentTrack.id === track.id ? track.color : 'var(--text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{track.title}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {track.artist}
              </div>
            </div>

            <button onClick={e => { e.stopPropagation(); onLike(track.id); }} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: liked.has(track.id) ? track.color : 'var(--muted)',
              transition: 'all 0.15s',
              padding: 4,
            }}>
              <Heart size={14} fill={liked.has(track.id) ? 'currentColor' : 'none'} />
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {tracks.map((track, i) => (
        <div
          key={track.id}
          onMouseEnter={() => setHoveredTrack(track.id)}
          onMouseLeave={() => setHoveredTrack(null)}
          style={{
            display: 'grid', gridTemplateColumns: '32px 32px 1fr 100px 80px',
            alignItems: 'center', gap: 10, padding: '8px 20px',
            background: currentTrack.id === track.id ? track.color + '12' : (hoveredTrack === track.id ? 'var(--surface2)' : 'transparent'),
            borderLeft: currentTrack.id === track.id ? `2px solid ${track.color}` : '2px solid transparent',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onDoubleClick={() => onPlay(track)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <input
              type="checkbox"
              checked={selectedTracks.has(track.id)}
              onChange={() => onSelectTrack(track.id)}
              onClick={e => e.stopPropagation()}
              style={{ cursor: 'pointer' }}
            />
          </div>
      
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {hoveredTrack === track.id || currentTrack.id === track.id ? (
              <button onClick={(e) => { e.stopPropagation(); onPlay(track); }} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: currentTrack.id === track.id ? track.color : 'var(--text)', padding: 0,
              }}>
                {isPlaying && currentTrack.id === track.id ? (
                  <Bars color={track.color} />
                ) : (
                  <Play size={14} fill="currentColor" />
                )}
              </button>
            ) : (
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>{i + 1}</span>
            )}
          </div>

          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontSize: 13, fontWeight: 500, color: currentTrack.id === track.id ? track.color : 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{track.title}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {track.artist}
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{track.album}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{formatTime(track.duration)}</div>

          <button onClick={e => { e.stopPropagation(); onLike(track.id); }} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: liked.has(track.id) ? track.color : (hoveredTrack === track.id ? 'var(--muted)' : 'transparent'),
            transition: 'all 0.15s',
          }}>
            <Heart size={13} fill={liked.has(track.id) ? 'currentColor' : 'none'} />
          </button>
        </div>
      ))}
    </div>
  );
}

function GridView({ tracks, currentTrack, isPlaying, onPlay, onLike, liked, hoveredTrack, setHoveredTrack, isMobile }) {
  const gridCols = isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))';
  
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: gridCols,
      gap: 16, padding: '16px 20px',
    }}>
      {tracks.map(track => (
        <div
          key={track.id}
          onMouseEnter={() => setHoveredTrack(track.id)}
          onMouseLeave={() => setHoveredTrack(null)}
          style={{
            background: currentTrack.id === track.id ? track.color + '10' : 'var(--surface2)',
            borderRadius: 8, padding: 12, border: `1px solid ${currentTrack.id === track.id ? track.color : 'var(--border)'}`,
            transition: 'all 0.2s', cursor: 'pointer',
            transform: hoveredTrack === track.id ? 'translateY(-2px)' : 'translateY(0)',
          }}
          onDoubleClick={() => onPlay(track)}
        >
          <div style={{
            width: '100%', aspectRatio: 1, background: track.color + '20',
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12, position: 'relative',
          }}>
            <Music size={32} color={track.color} />
            {hoveredTrack === track.id && (
              <button onClick={(e) => { e.stopPropagation(); onPlay(track); }} style={{
                position: 'absolute', background: track.color, border: 'none',
                borderRadius: '50%', width: 40, height: 40, display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                {isPlaying && currentTrack.id === track.id ? 
                  <Pause size={16} /> : <Play size={16} fill="#000" />
                }
              </button>
            )}
          </div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {track.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
            {track.artist}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>{formatTime(track.duration)}</span>
            <button onClick={e => { e.stopPropagation(); onLike(track.id); }} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: liked.has(track.id) ? track.color : 'var(--muted)',
            }}>
              <Heart size={12} fill={liked.has(track.id) ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlaylistView({ playlists, state, TRACKS, onAddToPlaylist }) {
  const [expandedPlaylist, setExpandedPlaylist] = useState(null);
  
  return (
    <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {playlists.map(pl => {
        const tracks = TRACKS.filter(t => pl.tracks.includes(t.id));
        const isExpanded = expandedPlaylist === pl.id;
        
        return (
          <div key={pl.id} style={{
            background: 'var(--surface2)', borderRadius: 10,
            border: `1px solid ${pl.color}40`, overflow: 'hidden',
            transition: 'all 0.2s',
          }}>
            <div style={{
              padding: '12px 16px', background: `linear-gradient(135deg, ${pl.color}20, transparent)`,
              borderBottom: `1px solid ${pl.color}40`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: pl.color }}>{pl.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 11 }}>{tracks.length} tracks</div>
                </div>
                <button onClick={() => { state.setQueue(tracks); state.setCurrentIndex(0); state.setIsPlaying(true); }}
                  style={{
                    background: pl.color, color: '#000', border: 'none',
                    borderRadius: 6, padding: '5px 12px', fontSize: 11,
                    cursor: 'pointer', fontWeight: 600,
                  }}>
                  Play
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {formatTime(tracks.reduce((a, t) => a + t.duration, 0))} total
              </div>
            </div>
            
            <div style={{ padding: '12px 16px', maxHeight: isExpanded ? 'none' : 200, overflow: 'hidden', position: 'relative' }}>
              {tracks.slice(0, isExpanded ? undefined : 5).map(t => (
                <div key={t.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '4px 0', fontSize: 12, borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {t.title} — {t.artist}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 8 }}>{formatTime(t.duration)}</span>
                </div>
              ))}
              {!isExpanded && tracks.length > 5 && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: 40, background: 'linear-gradient(to bottom, transparent, var(--surface2))',
                }} />
              )}
            </div>
            
            {tracks.length > 5 && (
              <button onClick={() => setExpandedPlaylist(isExpanded ? null : pl.id)} style={{
                width: '100%', padding: '8px', background: 'none', border: 'none',
                borderTop: '1px solid var(--border)', cursor: 'pointer', color: 'var(--muted)',
                fontSize: 11,
              }}>
                {isExpanded ? 'Show less' : `Show ${tracks.length - 5} more`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Bars({ color }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }}>
      {[1, 0.6, 0.85].map((h, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 1, background: color,
          height: 14 * h,
          animation: `bounce${i} 0.6s ease-in-out infinite alternate`,
        }} />
      ))}
      <style>{`
        @keyframes bounce0 { from { height: 8px } to { height: 14px } }
        @keyframes bounce1 { from { height: 5px } to { height: 12px } }
        @keyframes bounce2 { from { height: 10px } to { height: 6px } }
      `}</style>
    </div>
  );
}