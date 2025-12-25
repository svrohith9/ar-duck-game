import { useCallback, useRef } from 'react';
import { GAME_CONFIG } from '../lib/constants';
import { DuckPhysicsSystem } from '../lib/duckPhysics';

function createDuck() {
  return {
    id: '',
    x: 0,
    y: 0,
    velocityY: 0,
    velocityX: 0,
    rotation: 0,
    rotationSpeed: 0,
    scale: 0,
    image: null,
    shadow: null,
    shadowY: 0,
    active: false,
    despawning: false,
  };
}

export function useDuckSpawner() {
  const poolRef = useRef(Array.from({ length: GAME_CONFIG.duckPoolSize }, createDuck));
  const physicsRef = useRef(new DuckPhysicsSystem());
  const lastSpawnRef = useRef(0);

  const reset = useCallback(() => {
    poolRef.current.forEach((duck) => {
      duck.active = false;
      duck.despawning = false;
    });
    lastSpawnRef.current = 0;
  }, []);

  const spawn = useCallback((width, assets) => {
    const duck = poolRef.current.find((item) => !item.active);
    if (!duck || !assets) return;
    const size = 128;
    const img = assets.ducks[Math.floor(Math.random() * assets.ducks.length)];
    duck.id = `${Date.now()}-${Math.random()}`;
    duck.x = Math.random() * (width - size) + size * 0.5;
    duck.y = -size;
    duck.velocityY = 0;
    duck.velocityX = 0;
    duck.rotation = 0;
    duck.rotationSpeed = (Math.random() - 0.5) * 2;
    duck.scale = 0;
    duck.image = img;
    duck.shadow = assets.shadow;
    duck.shadowY = duck.y + 40;
    duck.active = true;
    duck.despawning = false;
  }, []);

  const update = useCallback((deltaMs, height, width, assets) => {
    lastSpawnRef.current += deltaMs;
    if (lastSpawnRef.current > GAME_CONFIG.spawnIntervalMs) {
      spawn(width, assets);
      lastSpawnRef.current = 0;
    }

    poolRef.current.forEach((duck) => {
      if (!duck.active) return;
      physicsRef.current.update(duck, deltaMs);
      if (duck.y > height + 200) {
        duck.active = false;
      }
      if (duck.despawning && duck.scale < 0.1) {
        duck.active = false;
      }
    });
  }, [spawn]);

  return {
    ducksRef: poolRef,
    reset,
    update,
  };
}
