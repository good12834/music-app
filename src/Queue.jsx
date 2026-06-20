import { useState } from 'react';
import { X, ListMusic, Trash2, Clock } from 'lucide-react';
import { formatTime } from './data.jsx';

export default function Queue({ state }) {
  const {
    queue, currentIndex, currentTrack, setIsPlaying, setCurrentIndex,
    removeFromQueue, clearQueue,
  } = state;

  const [confirmClear, setConfirmClear] = useState(false);

  const totalTime    = queue.reduce((a, t) => a + (t.duration || 0), 0);
  const remaining    = queue.slice(currentIndex).reduce((a, t) => a + (t.duration || 0), 0);

  const handleClear = () => {
    if (confirmClear) { clearQueue?.(); setConfirmClear(false); }
    else { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 2500); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ListMusic size={16} color="var(--muted)" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 2 }}>QUEUE</h2>
          </div>
          <button
            onClick={handleClear}
            style={{
              background: confirmClear ? '#ff474722' : 'none',
              border: `1px solid ${confirmClear ? '#ff4747' : 'var(--border)'}`,
              color: confirmClear ? '#ff4747' : 'var(--muted)',
              borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
              fontSize: 11, display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: 'var(--font-body)', transition: 'all 0.2s',
            }}
          >
            <Trash2 size={11} />
            {confirmClear ? 'Confirm?' : 'Clear'}
          </button>
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 11, display: 'flex', gap: 12 }}>
          <span>{queue.length} tracks</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={10} /> {formatTime(remaining)} remaining
          </span>
        </div>
      </div>

      {/* Track list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {queue.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
            Queue is empty
          </div>
        ) : (
          queue.map((track, i) => {
            const isCurrent = i === currentIndex;
            const isPast    = i < currentIndex;
            return (
              <QueueRow
                key={track.id + '-' + i}
                track={track}
                isCurrent={isCurrent}
                isPast={isPast}
                onPlay={() => { setCurrentIndex(i); setIsPlaying(true); }}
                onRemove={() => removeFromQueue?.(i)}
                canRemove={queue.length > 1 && !isCurrent}
              />
            );
          })
        )}
      </div>

      {/* Stats */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid var(--border)',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
      }}>
        {[
          ['Total',   formatTime(totalTime)],
          ['Tracks',  queue.length],
          ['Genre',   currentTrack.genre],
          ['BPM',     currentTrack.bpm],
        ].map(([label, val]) => (
          <div key={label} style={{ background: 'var(--surface2)', borderRadius: 6, padding: '6px 10px' }}>
            <div style={{ color: 'var(--muted)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
            <div style={{ color: currentTrack.color, fontSize: 13, fontWeight: 600, marginTop: 1 }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QueueRow({ track, isCurrent, isPast, onPlay, onRemove, canRemove }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onPlay}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 16px', cursor: 'pointer',
        background: isCurrent ? track.color + '15' : hover ? 'var(--surface2)' : 'transparent',
        borderLeft: isCurrent ? `2px solid ${track.color}` : '2px solid transparent',
        opacity: isPast ? 0.38 : 1,
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
        background: isCurrent ? track.color : 'var(--border)',
        boxShadow: isCurrent ? `0 0 6px ${track.color}` : 'none',
      }} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          fontSize: 12, fontWeight: 500,
          color: isCurrent ? track.color : 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{track.title}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{track.artist}</div>
      </div>
      <span style={{ color: 'var(--muted)', fontSize: 10, flexShrink: 0 }}>
        {formatTime(track.duration)}
      </span>
      {canRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: hover ? '#ff4747' : 'transparent',
            padding: 2, borderRadius: 4, display: 'flex',
            transition: 'color 0.15s',
          }}
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}