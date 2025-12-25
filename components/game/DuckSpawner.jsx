import { useCallback, useRef } from 'react';
import { GAME_CONFIG } from '../../lib/constants';

function createDuck() {
  return {
    x: 0,
    y: 0,
    size: 12,
    speed: 120,
    active: false,
  };
}

export function useDuckSpawner() {
  const poolRef = useRef(Array.from({ length: GAME_CONFIG.duckPoolSize }, createDuck));
  const lastSpawnRef = useRef(0);

  const reset = useCallback(() => {
    poolRef.current.forEach((duck) => {
      duck.active = false;
    });
    lastSpawnRef.current = 0;
  }, []);

  const spawn = useCallback((width) => {
    const duck = poolRef.current.find((item) => !item.active);
    if (!duck) return;
    const size = 12 + Math.random() * 12;
    duck.size = size;
    duck.x = Math.random() * (width - size * 2) + size;
    duck.y = -size * 2;
    duck.speed = GAME_CONFIG.minSpeed + Math.random() * (GAME_CONFIG.maxSpeed - GAME_CONFIG.minSpeed);
    duck.active = true;
  }, []);

  const update = useCallback((deltaMs, height, width) => {
    lastSpawnRef.current += deltaMs;
    if (lastSpawnRef.current > GAME_CONFIG.spawnIntervalMs) {
      spawn(width);
      lastSpawnRef.current = 0;
    }

    poolRef.current.forEach((duck) => {
      if (!duck.active) return;
      duck.y += (duck.speed * deltaMs) / 1000;
      if (duck.y > height + duck.size * 2) {
        duck.active = false;
      }
    });
  }, [spawn]);

  return {
    ducks: poolRef,
    reset,
    update,
  };
}
