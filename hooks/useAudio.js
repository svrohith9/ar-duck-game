import { useCallback, useRef } from 'react';

export function useAudio() {
  const audioCtx = useRef(null);
  const sounds = useRef({});

  const ensureContext = useCallback(() => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  const loadSound = useCallback(async (url, name) => {
    ensureContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.current.decodeAudioData(arrayBuffer);
    sounds.current[name] = audioBuffer;
  }, [ensureContext]);

  const play = useCallback((name) => {
    if (!audioCtx.current || !sounds.current[name]) return;
    const source = audioCtx.current.createBufferSource();
    source.buffer = sounds.current[name];
    source.connect(audioCtx.current.destination);
    source.start();
  }, []);

  const haptic = useCallback((pattern = [60]) => {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  }, []);

  return { loadSound, play, haptic };
}
