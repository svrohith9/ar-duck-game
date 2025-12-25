import { useEffect, useRef } from 'react';

export function useAnimationFrame(callback, options = {}) {
  const { fpsCap = 60 } = options;
  const frameRef = useRef(null);
  const lastRef = useRef(0);

  useEffect(() => {
    const frameDuration = 1000 / fpsCap;

    const loop = (time) => {
      if (!lastRef.current) lastRef.current = time;
      const delta = time - lastRef.current;
      if (delta >= frameDuration) {
        lastRef.current = time;
        callback(delta, time);
      }
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [callback, fpsCap]);
}
