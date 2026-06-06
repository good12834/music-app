import { useEffect, useRef } from 'react';

export default function Visualizer({ isPlaying, color = '#e8ff47', bpm = 120, analyserNode }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const bars = 48;
    const speed = bpm / 60;
    // Typed array for real FFT data
    const fftSize = analyserNode ? analyserNode.frequencyBinCount : 0;
    const fftData = fftSize > 0 ? new Uint8Array(fftSize) : null;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;

      if (isPlaying) timeRef.current += 0.016 * speed;
      const t = timeRef.current;

      ctx.clearRect(0, 0, W, H);

      const barW = W / bars;

      for (let i = 0; i < bars; i++) {
        let amp;

        if (analyserNode && fftData && isPlaying) {
          // Real FFT: map bar index to frequency bin
          analyserNode.getByteFrequencyData(fftData);
          const binIndex = Math.floor((i / bars) * fftData.length * 0.8); // use lower 80% of spectrum
          amp = fftData[binIndex] / 255;
          // Subtle animated detail on top of real data
          amp = amp * 0.85 + Math.sin(t * 3 + (i / bars) * Math.PI * 2) * 0.08 * amp;
        } else {
          const phase = (i / bars) * Math.PI * 2;
          const base  = Math.sin(t * 2 + phase) * 0.5 + 0.5;
          const detail = Math.sin(t * 5 + phase * 3) * 0.15;
          amp = isPlaying ? (base + detail) : 0.03 + Math.sin(t * 0.3 + phase) * 0.02;
        }

        const h = Math.max(amp * H * 0.82, 2);
        const grad = ctx.createLinearGradient(0, H - h, 0, H);
        grad.addColorStop(0, color + 'ff');
        grad.addColorStop(1, color + '1a');
        ctx.fillStyle = grad;

        const x = i * barW + barW * 0.15;
        const w = barW * 0.7;
        const r = Math.min(w / 2, 4);
        ctx.beginPath();
        ctx.roundRect(x, H - h, w, h, [r, r, 1, 1]);
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, [isPlaying, color, bpm, analyserNode]);

  return (
    <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
  );
}