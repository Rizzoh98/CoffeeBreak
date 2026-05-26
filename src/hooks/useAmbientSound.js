import { useState, useRef, useCallback, useEffect } from 'react';

export function useAmbientSound() {
  const audioCtxRef = useRef(null);
  const nodesRef = useRef([]);

  const stopSound = useCallback(() => {
    nodesRef.current.forEach(node => {
      try { if (node.stop) node.stop(); node.disconnect(); } catch (e) {}
    });
    nodesRef.current = [];
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
  }, []);

  const startSound = useCallback((type) => {
    stopSound();
    if (type === 'none') return;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      if (type === 'rain') {
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        const gain = ctx.createGain();
        gain.gain.value = 0.15;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start();
        nodesRef.current = [source, filter, gain];
      } else if (type === 'cafe') {
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const gain = ctx.createGain();
        gain.gain.value = 0.2;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start();
        nodesRef.current = [source, gain];
      }
    } catch (e) { /* Web Audio not available */ }
  }, [stopSound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopSound();
  }, [stopSound]);

  return { startSound, stopSound };
}
