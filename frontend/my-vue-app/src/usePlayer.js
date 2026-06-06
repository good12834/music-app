
import { useState, useEffect, useRef, useCallback } from 'react';
import { TRACKS } from './data.jsx';
import { getStreamUrl } from './audius.js';
//import TrackArt from './TrackArt.jsx';
export function usePlayer() {
  const [queue, setQueue] = useState(TRACKS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('none');
  const [liked, setLiked] = useState(new Set());
  const [analyserNode, setAnalyserNode] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [crossfadeDuration, setCrossfadeDuration] = useState(0);
  const [equalizer, setEqualizer] = useState({ bass: 0, mid: 0, treble: 0 });
  const [playHistory, setPlayHistory] = useState([]);
  const [playCount, setPlayCount] = useState({});
  const [, setLastPlayed] = useState({});
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleQueue, setShuffleQueue] = useState([]);
  const [shuffleIndex, setShuffleIndex] = useState(0);

  const audioRef = useRef(null);
  const sourceRef = useRef(null);
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const gainNodeRef = useRef(null);
  const equalizerNodesRef = useRef({});
  const crossfadeTimeoutRef = useRef(null);
  // Keep a stable ref to queue length for use inside callbacks
  const queueRef = useRef(queue);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  const currentTrack = queue[currentIndex] || TRACKS[0];

  // ── Equalizer ──────────────────────────────────────────────────────────────

  const createEqualizer = useCallback((ctx, source) => {
    const bass = ctx.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 200;
    bass.gain.value = 0;

    const mid = ctx.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1000;
    mid.gain.value = 0;

    const treble = ctx.createBiquadFilter();
    treble.type = 'highshelf';
    treble.frequency.value = 5000;
    treble.gain.value = 0;

    source.connect(bass);
    bass.connect(mid);
    mid.connect(treble);

    equalizerNodesRef.current = { bass, mid, treble };
    return treble;
  }, []);

  useEffect(() => {
    const nodes = equalizerNodesRef.current;
    if (nodes.bass) {
      nodes.bass.gain.value = equalizer.bass;
      nodes.mid.gain.value = equalizer.mid;
      nodes.treble.gain.value = equalizer.treble;
    }
  }, [equalizer]);

  // ── Audio setup ────────────────────────────────────────────────────────────

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audioRef.current = audio;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      setAudioContext(ctx);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      setAnalyserNode(analyser);

      const gainNode = ctx.createGain();
      gainNode.gain.value = 1;
      gainNodeRef.current = gainNode;

      const source = ctx.createMediaElementSource(audio);
      sourceRef.current = source;

      const eqOut = createEqualizer(ctx, source);
      eqOut.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(ctx.destination);
    } catch (err) {
      console.warn('[audio] Web Audio API unavailable:', err.message);
    }

    audio.volume = 0.8;

    return () => {
      clearTimeout(crossfadeTimeoutRef.current);
      audio.pause();
      audio.src = '';
      ctxRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Playback event listeners ───────────────────────────────────────────────

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onDurationChange = () => { if (isFinite(audio.duration)) setDuration(audio.duration); };
    const onLoadedMetadata = () => { if (isFinite(audio.duration)) setDuration(audio.duration); };

    const onEnded = () => {
      setPlayHistory(p => [...p, { trackId: currentTrack.id, timestamp: Date.now(), completed: true }]);
      setPlayCount(p => ({ ...p, [currentTrack.id]: (p[currentTrack.id] || 0) + 1 }));
      setLastPlayed(p => ({ ...p, [currentTrack.id]: Date.now() }));

      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else if (repeat === 'all') {
        setCurrentIndex(i => (i + 1) % queueRef.current.length);
      } else {
        setCurrentIndex(i => {
          if (i < queueRef.current.length - 1) return i + 1;
          setIsPlaying(false);
          return i;
        });
      }
    };

    const onPlay  = () => setPlayHistory(p => [...p, { trackId: currentTrack.id, timestamp: Date.now(), action: 'play' }]);
    const onPause = () => setPlayHistory(p => [...p, { trackId: currentTrack.id, timestamp: Date.now(), action: 'pause' }]);

    audio.addEventListener('timeupdate',      onTimeUpdate);
    audio.addEventListener('durationchange',  onDurationChange);
    audio.addEventListener('loadedmetadata',  onLoadedMetadata);
    audio.addEventListener('ended',           onEnded);
    audio.addEventListener('play',            onPlay);
    audio.addEventListener('pause',           onPause);

    return () => {
      audio.removeEventListener('timeupdate',      onTimeUpdate);
      audio.removeEventListener('durationchange',  onDurationChange);
      audio.removeEventListener('loadedmetadata',  onLoadedMetadata);
      audio.removeEventListener('ended',           onEnded);
      audio.removeEventListener('play',            onPlay);
      audio.removeEventListener('pause',           onPause);
    };
  }, [repeat, currentTrack.id]);

  // ── Track change + play/pause ──────────────────────────────────────────────

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const resolvedUrl = currentTrack.trackId
      ? getStreamUrl(currentTrack.trackId)
      : (currentTrack.url || '');

    if (resolvedUrl && resolvedUrl !== audio.src) {
      if (crossfadeDuration > 0) {
        audio.volume = 0;
        audio.src = resolvedUrl;
        audio.load();
        let v = 0;
        const fadeIn = setInterval(() => {
          v = Math.min(v + 0.05, volume);
          audio.volume = v;
          if (v >= volume) clearInterval(fadeIn);
        }, crossfadeDuration * 20);
      } else {
        audio.src = resolvedUrl;
        audio.load();
      }
      setProgress(0);
    }

    if (isPlaying) {
      ctxRef.current?.state === 'suspended' && ctxRef.current.resume();
      audio.playbackRate = playbackRate;
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isPlaying]);

  // Volume sync (skip during crossfade)
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && !crossfadeTimeoutRef.current) audio.volume = volume;
  }, [volume]);

  // Playback rate sync
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = playbackRate;
  }, [playbackRate]);

  // ── Shuffle queue ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (shuffle && !isShuffling) {
      const shuffled = [...queue];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setShuffleQueue(shuffled);
      setShuffleIndex(shuffled.findIndex(t => t.id === currentTrack.id));
      setIsShuffling(true);
    } else if (!shuffle && isShuffling) {
      setIsShuffling(false);
      setShuffleQueue([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuffle]);

  const getCurrentTrack = useCallback(() => {
    if (shuffle && isShuffling && shuffleQueue.length > 0) {
      return shuffleQueue[shuffleIndex] || currentTrack;
    }
    return currentTrack;
  }, [shuffle, isShuffling, shuffleQueue, shuffleIndex, currentTrack]);

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    setProgress(0);
    if (repeat === 'one') {
      const audio = audioRef.current;
      if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
      return;
    }
    if (shuffle && isShuffling) {
      const nextSI = (shuffleIndex + 1) % shuffleQueue.length;
      setShuffleIndex(nextSI);
      const mi = queueRef.current.findIndex(t => t.id === shuffleQueue[nextSI].id);
      if (mi !== -1) setCurrentIndex(mi);
    } else {
      setCurrentIndex(i => repeat === 'all' ? (i + 1) % queueRef.current.length : Math.min(i + 1, queueRef.current.length - 1));
    }
  }, [shuffle, isShuffling, shuffleIndex, shuffleQueue, repeat]);

  const handlePrev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; setProgress(0); return; }
    setProgress(0);
    if (shuffle && isShuffling) {
      const prevSI = shuffleIndex > 0 ? shuffleIndex - 1 : shuffleQueue.length - 1;
      setShuffleIndex(prevSI);
      const mi = queueRef.current.findIndex(t => t.id === shuffleQueue[prevSI].id);
      if (mi !== -1) setCurrentIndex(mi);
    } else {
      setCurrentIndex(i => Math.max(i - 1, 0));
    }
  }, [shuffle, isShuffling, shuffleIndex, shuffleQueue]);

  // ── Queue operations ───────────────────────────────────────────────────────

  const playTrack = useCallback((track) => {
    const idx = queueRef.current.findIndex(t => t.id === track.id);
    if (idx !== -1) {
      setCurrentIndex(idx);
    } else {
      setQueue(q => [...q, track]);
      setCurrentIndex(queueRef.current.length);
    }
    setProgress(0);
    setIsPlaying(true);
    setPlayHistory(p => [...p, { trackId: track.id, timestamp: Date.now(), action: 'start' }]);
  }, []);

  const addToQueue = useCallback((track) => {
    setQueue(q => [...q, track]);
  }, []);

  const removeFromQueue = useCallback((index) => {
    if (queueRef.current.length <= 1) return;
    setQueue(q => q.filter((_, i) => i !== index));
    if (index < currentIndex) setCurrentIndex(i => i - 1);
    else if (index === currentIndex) setCurrentIndex(i => Math.min(i, queueRef.current.length - 2));
  }, [currentIndex]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(0);
    setIsPlaying(false);
  }, []);

  const getTrackStreamUrl = useCallback((track) => {
    if (track?.trackId) return getStreamUrl(track.trackId);
    return track?.url || '';
  }, []);

  const toggleLike = useCallback((id) => {
    setLiked(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const seek = useCallback((val) => {
    const audio = audioRef.current;
    const dur = (isFinite(audio?.duration) ? audio.duration : null) || duration || currentTrack.duration;
    const time = (val / 100) * dur;
    if (audio) audio.currentTime = time;
    setProgress(time);
  }, [duration, currentTrack.duration]);

  const setEqualizerBand = useCallback((band, value) => {
    setEqualizer(prev => ({ ...prev, [band]: value }));
  }, []);

  // ── Analytics helpers ──────────────────────────────────────────────────────

  const getMostPlayedTracks = useCallback((limit = 10) => {
    return Object.entries(playCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id]) => TRACKS.find(t => t.id === parseInt(id)))
      .filter(Boolean);
  }, [playCount]);

  const getRecentlyPlayed = useCallback((limit = 10) => {
    return playHistory
      .filter(h => h.action === 'play' || h.action === 'start')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .map(h => TRACKS.find(t => t.id === h.trackId))
      .filter(Boolean);
  }, [playHistory]);

  return {
    currentTrack: getCurrentTrack(),
    queue,
    currentIndex,
    isPlaying,
    progress,
    duration,
    volume,
    shuffle,
    repeat,
    liked,
    analyserNode,
    audioContext,
    playbackRate,
    crossfadeDuration,
    equalizer,
    playHistory,
    playCount,
    playlist: queue,

    setIsPlaying,
    setVolume,
    setShuffle,
    setRepeat,
    setPlaybackRate,
    setCrossfadeDuration,
    setEqualizerBand,
    handleNext,
    handlePrev,
    playTrack,
    getTrackStreamUrl,
    toggleLike,
    seek,
    setQueue,
    setCurrentIndex,
    addToQueue,
    removeFromQueue,
    clearQueue,
    getMostPlayedTracks,
    getRecentlyPlayed,

    allTracks: TRACKS,
  };
}