import { useEffect, useRef, useState } from 'react';
import { getImageWithFallback, markUrlAsFailed } from './audius.js';

export default function TrackArt({ track, isPlaying, size = 200, analyserNode }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const dataRef = useRef(null);
  const imgRef = useRef(null);
  // null = not tried yet, true = loaded OK, false = failed
  const [imgLoaded, setImgLoaded] = useState(null);

  // Whenever the thumbnail URL changes, try to pre-load it
  useEffect(() => {
    setImgLoaded(null);
    imgRef.current = null;
    if (!track.thumbnail) { setImgLoaded(false); return; }

    const safeUrl = getImageWithFallback(track.thumbnail);
    // If already failed, skip loading
    if (safeUrl.startsWith('data:image/svg+xml')) {
      setImgLoaded(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => { imgRef.current = img; setImgLoaded(true); };
    img.onerror = () => { 
      imgRef.current = null; 
      markUrlAsFailed(track.thumbnail, 503); 
      setImgLoaded(false); 
    };
    img.src = safeUrl;
  }, [track.thumbnail]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    if (analyserNode && !dataRef.current) {
      dataRef.current = new Uint8Array(analyserNode.frequencyBinCount);
    }

    const draw = () => {
      const S = size;
      const color = track.color || '#6366f1';

      // If album art loaded successfully, paint it and add a subtle overlay
      if (imgRef.current) {
        ctx.save();
        // Rounded clip
        ctx.beginPath();
        ctx.roundRect(0, 0, S, S, 12);
        ctx.clip();
        ctx.drawImage(imgRef.current, 0, 0, S, S);
        ctx.restore();

        // Dark vignette overlay so visualizer rings are visible when playing
        if (isPlaying && analyserNode && dataRef.current) {
          analyserNode.getByteFrequencyData(dataRef.current);
          const avg = dataRef.current.reduce((a, b) => a + b) / dataRef.current.length;
          const scale = avg / 255;

          ctx.strokeStyle = color + 'aa';
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(S / 2, S / 2, (S / 6) * (i + 1) * (0.8 + scale * 0.4), 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        frameRef.current = requestAnimationFrame(draw);
        return;
      }

      // Fallback: animated visualizer circles
      const bgGrad = ctx.createLinearGradient(0, 0, S, S);
      bgGrad.addColorStop(0, '#0a0a0a');
      bgGrad.addColorStop(1, '#151515');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, S, S);

      if (analyserNode && dataRef.current && isPlaying) {
        analyserNode.getByteFrequencyData(dataRef.current);
        const avg = dataRef.current.reduce((a, b) => a + b) / dataRef.current.length;
        const scale = avg / 255;

        ctx.strokeStyle = color + '88';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(S / 2, S / 2, (S / 6) * (i + 1) * (0.8 + scale * 0.4), 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = color + '44';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(S / 2, S / 2, (S / 6) * (i + 1), 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.fillStyle = color + '66';
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, S / 8, 0, Math.PI * 2);
      ctx.fill();

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  // imgLoaded triggers a re-run so the canvas switches between art / fallback
  }, [isPlaying, size, track.color, analyserNode, imgLoaded]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        display: 'block',
      }}
    />
  );
}