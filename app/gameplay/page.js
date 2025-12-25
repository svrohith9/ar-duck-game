'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from 'react-error-boundary';
import useGameStore from '../../store/gameStore';
import PoseTrackerScripts from '../../components/game/PoseTracker';
import GameCanvas from '../../components/game/GameCanvas';
import GameplayHUD from '../../components/GameplayHUD';
import { useAudio } from '../../hooks/useAudio';

function ErrorFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-white">
      <div className="glass-panel px-6 py-4 rounded-2xl">AR system failed to load.</div>
    </div>
  );
}

export default function GameplayPage() {
  const router = useRouter();
  const [duckList, setDuckList] = useState([]);
  const screen = useGameStore((state) => state.screen);
  const endGame = useGameStore((state) => state.endGame);
  const recordShot = useGameStore((state) => state.recordShot);
  const togglePause = useGameStore((state) => state.togglePause);
  const paused = useGameStore((state) => state.paused);
  const { haptic } = useAudio();
  const audioRef = useRef({ ctx: null, gain: null, osc: null, started: false });

  const handleShoot = useCallback(() => {
    recordShot();
    if (useGameStore.getState().hapticFeedback) {
      haptic([40]);
    }
  }, [haptic, recordShot]);

  const handleGameOver = useCallback(() => {
    endGame();
    router.push('/game-over');
  }, [endGame, router]);

  useEffect(() => {
    if (screen !== 'GAMEPLAY') {
      router.replace('/');
    }
  }, [router, screen]);

  useEffect(() => {
    if (screen === 'GAME_OVER') {
      router.push('/game-over');
    }
  }, [router, screen]);

  useEffect(() => {
    const startAmbient = async () => {
      if (!audioRef.current.started) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const master = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const compressor = ctx.createDynamicsCompressor();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const osc3 = ctx.createOscillator();

        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc3.type = 'sine';

        osc1.frequency.value = 110;
        osc2.frequency.value = 165;
        osc3.frequency.value = 220;

        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.6;

        lfo.type = 'sine';
        lfo.frequency.value = 0.18;
        lfoGain.gain.value = 120;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        master.gain.value = 0;

        osc1.connect(filter);
        osc2.connect(filter);
        osc3.connect(filter);
        filter.connect(compressor);
        compressor.connect(master);
        master.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc3.start();
        lfo.start();

        audioRef.current = { ctx, gain: master, osc: [osc1, osc2, osc3, lfo], started: true };
      }

      if (audioRef.current.ctx?.state === 'suspended') {
        await audioRef.current.ctx.resume();
      }

      audioRef.current.gain.gain.setTargetAtTime(0.16, audioRef.current.ctx.currentTime, 0.5);
    };

    const handleUserGesture = () => startAmbient();
    window.addEventListener('pointerdown', handleUserGesture);
    window.addEventListener('keydown', handleUserGesture);

    return () => {
      window.removeEventListener('pointerdown', handleUserGesture);
      window.removeEventListener('keydown', handleUserGesture);
    };
  }, []);

  useEffect(() => {
    const { ctx, gain } = audioRef.current;
    if (!ctx || !gain) return;
    if (paused) {
      gain.gain.setTargetAtTime(0.0, ctx.currentTime, 0.2);
    } else {
      gain.gain.setTargetAtTime(0.16, ctx.currentTime, 0.2);
    }
  }, [paused]);

  useEffect(() => {
    return () => {
      const { ctx, osc } = audioRef.current;
      if (Array.isArray(osc)) osc.forEach((node) => node.stop());
      if (ctx) ctx.close();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const ducks = Array.from({ length: 6 }).map((_, index) => ({ id: index }));
      setDuckList(ducks);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative bg-background-dark text-white h-screen w-screen overflow-hidden" id="ui-overlay">
      <PoseTrackerScripts />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <GameCanvas onGameOver={handleGameOver} onShoot={handleShoot} />
      </ErrorBoundary>
      <GameplayHUD onPause={togglePause} ducks={duckList} />
      {paused && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 text-white">
          <div className="glass-panel px-8 py-6 rounded-2xl text-center flex flex-col gap-4 pointer-events-auto">
            <div>
              <div className="text-2xl font-bold">Paused</div>
              <div className="text-xs text-white/70 mt-1">Ready to jump back in?</div>
            </div>
            <button
              onClick={togglePause}
              className="px-6 py-3 bg-primary hover:bg-primary-hover text-background-dark font-bold rounded-full transition-all"
            >
              Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
