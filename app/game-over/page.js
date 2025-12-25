'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '../../store/gameStore';
import Icon from '../../components/ui/Icon';
import { formatScore } from '../../lib/utils';

export default function GameOverPage() {
  const router = useRouter();
  const {
    screen,
    score,
    resetGame,
    startGame,
  } = useGameStore();

  useEffect(() => {
    if (screen === 'START') {
      router.replace('/');
    }
  }, [router, screen]);

  return (
    <div className="bg-background-dark text-white min-h-screen overflow-x-hidden">
      <div className="fixed inset-0 w-full h-full z-0 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-b from-[#4a4721] to-[#1a1908] opacity-80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent" />
      </div>
      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center p-4">
        <div className="layout-container flex w-full max-w-[520px] flex-col gap-6">
          <div className="flex flex-col items-center justify-center pt-6 pb-2">
            <h1 className="text-white tracking-tight text-5xl md:text-6xl font-black leading-tight text-center drop-shadow-sm uppercase">
              Game Over
            </h1>
            <p className="text-gray-400 text-lg font-medium mt-2 tracking-wide">Awesome run!</p>
          </div>
          <div className="flex flex-col items-center justify-center py-6">
            <span className="text-primary text-sm font-bold tracking-[0.2em] uppercase mb-1">Final Score</span>
            <div className="text-[72px] leading-none font-bold text-white tracking-tighter drop-shadow-2xl">
              {formatScore(score)}
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-4 px-4 pb-8 w-full">
            <button
              onClick={() => {
                startGame();
                router.push('/gameplay');
              }}
              className="group flex w-full items-center justify-center overflow-hidden rounded-full h-14 px-5 bg-primary hover:bg-[#e0cd05] transition-colors text-background-dark gap-3 text-lg font-bold leading-normal tracking-wide shadow-lg shadow-primary/20"
            >
              <Icon name="replay" className="text-background-dark group-hover:translate-x-1 transition-transform" />
              <span className="truncate">Play Again</span>
            </button>
            <button
              onClick={() => {
                resetGame();
                router.push('/');
              }}
              className="group flex w-full items-center justify-center overflow-hidden rounded-full h-14 px-5 bg-transparent border-2 border-white/10 hover:bg-white/5 transition-all text-white gap-3 text-base font-bold leading-normal tracking-wide"
            >
              <Icon name="home" className="text-white/80 group-hover:-translate-x-1 transition-transform" />
              <span className="truncate">Main Menu</span>
            </button>
          </div>
        </div>
      </div>
      <div className="fixed top-0 left-0 p-8 z-0 opacity-20 pointer-events-none hidden md:block">
        <div className="w-32 h-32 rounded-full blur-2xl mix-blend-screen bg-yellow-400/30" />
      </div>
      <div className="fixed bottom-0 right-0 p-8 z-0 opacity-20 pointer-events-none hidden md:block">
        <div className="w-48 h-48 rounded-full blur-3xl mix-blend-screen bg-yellow-400/20" />
      </div>
    </div>
  );
}
