import { useState, useRef, useCallback, useEffect } from 'react';
import { useAmbientSound } from './useAmbientSound';

export function useTimer(onComplete) {
  const [remaining, setRemaining] = useState(300);
  const [total, setTotal] = useState(300);
  const [running, setRunning] = useState(false);
  const [selectedSound, setSelectedSound] = useState('none');
  const intervalRef = useRef(null);
  const { startSound, stopSound } = useAmbientSound();

  const setPreset = useCallback((minutes) => {
    if (running) return;
    setTotal(minutes * 60);
    setRemaining(minutes * 60);
  }, [running]);

  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    if (selectedSound !== 'none') startSound(selectedSound);
  }, [running, selectedSound, startSound]);

  const stop = useCallback(() => {
    setRunning(false);
    clearInterval(intervalRef.current);
    stopSound();
    setRemaining(total);
  }, [total, stopSound]);

  const changeSound = useCallback((sound) => {
    setSelectedSound(sound);
    if (running) {
      stopSound();
      if (sound !== 'none') startSound(sound);
    }
  }, [running, startSound, stopSound]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setRunning(false);
          clearInterval(intervalRef.current);
          stopSound();
          if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, stopSound, onComplete]);

  const progress = remaining / total;
  const circumference = 2 * Math.PI * 72;
  const dashOffset = circumference * (1 - progress);
  const displayMinutes = Math.floor(remaining / 60);
  const displaySeconds = remaining % 60;
  const display = `${displayMinutes}:${displaySeconds.toString().padStart(2, '0')}`;

  return {
    remaining, total, running, selectedSound,
    progress, circumference, dashOffset, display,
    setPreset, start, stop, changeSound
  };
}
