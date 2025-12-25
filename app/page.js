'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '../store/gameStore';
import { useWebXR } from '../hooks/useWebXR';
import { useCamera } from '../hooks/useCamera';
import Icon from '../components/ui/Icon';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function StartScreen() {
  const router = useRouter();
  const { isSupported } = useWebXR();
  const { requestCamera, loading } = useCamera();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const setWebXRSupported = useGameStore((state) => state.setWebXRSupported);
  const setCameraPermission = useGameStore((state) => state.setCameraPermission);
  const startGame = useGameStore((state) => state.startGame);
  const resetGame = useGameStore((state) => state.resetGame);

  useEffect(() => {
    setWebXRSupported(isSupported);
  }, [isSupported, setWebXRSupported]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const handleStart = async () => {
    const { stream, error } = await requestCamera();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermission(true);
      startGame();
      router.push('/gameplay');
    } else if (error) {
      setCameraPermission(false);
    }
  };

  const handleMouseMove = (event) => {
    const { innerWidth, innerHeight } = window;
    const x = ((event.clientX / innerWidth) - 0.5) * 12;
    const y = ((event.clientY / innerHeight) - 0.5) * 12;
    setOffset({ x, y });
  };

  return (
    <div
      className="font-display bg-background-light dark:bg-background-dark text-white overflow-hidden h-screen w-screen flex flex-col"
      onMouseMove={handleMouseMove}
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDkRjH3cK-ovraQU8G6bDV8pmBP1CeN7yeOhsaZgq8SnyNXkWoMJYAPoiCp6EBvf1IVyUlLqjKWwjUHU6o02mbgBYPbZZOTyt2_7kU7YwtbzlG44GldClWsAtlKSc0mxFvnm5smwLIXA6sHG4pLVo3wh07gOpWtrlF3qsO2N2gX3VNNU37Yz1Nzlu_CHibl-pxCKr_KEMRITBn37W9uBXrZP412ZPCEj_kG8wLcY0-vThbM0I-ItUyKOBrUJvKqrBGAclJtfng6XjT8')",
          }}
        />
        <div
          className="absolute inset-0 grid-bg opacity-30"
          style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent" />
        <div className="scan-line" />
      </div>

      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-full">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-background-dark">
            <Icon name="videogame_asset" className="text-lg" />
          </div>
          <h1 className="font-bold text-lg tracking-tight hidden sm:block">ESCAPE DUCKS</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full text-xs font-medium text-white/70">
            <span className={`w-2 h-2 rounded-full ${isSupported ? 'bg-green-500' : 'bg-yellow-400'} animate-pulse`} />
            {isSupported ? 'WebXR Ready' : 'WebXR Check'}
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 w-full max-w-7xl mx-auto">
        <div className="flex flex-col items-center w-full max-w-lg">
          <div className="mb-16 text-center relative group cursor-default">
            <div className="absolute -inset-8 bg-primary/20 blur-3xl rounded-full opacity-50 group-hover:opacity-70 transition-opacity duration-700" />
            <h1 className="relative text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-2xl leading-[0.85]">
              ESCAPE<br />
              <span className="text-primary">DUCKS</span>
            </h1>
            <div className="mt-6 flex justify-center gap-3">
              <span className="px-3 py-1 rounded border border-white/10 bg-white/5 text-[10px] uppercase tracking-widest text-white/50 font-semibold backdrop-blur-sm">Season 1</span>
              <span className="px-3 py-1 rounded border border-primary/30 bg-primary/10 text-[10px] uppercase tracking-widest text-primary font-semibold backdrop-blur-sm">AR Arcade</span>
            </div>
          </div>
          <div className="w-full flex flex-col gap-10 items-center">
            <button
              onClick={handleStart}
              disabled={loading}
              className="group relative flex items-center justify-center w-full md:w-96 h-20 md:h-24 bg-primary hover:bg-primary-hover text-background-dark text-2xl md:text-3xl font-black tracking-tight rounded-full shadow-[0_0_40px_-10px_rgba(249,228,6,0.6)] hover:shadow-[0_0_80px_-20px_rgba(249,228,6,0.8)] transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-70"
            >
              <Icon name="view_in_ar" className="mr-4 text-4xl group-hover:rotate-12 transition-transform duration-300" />
              {loading ? 'REQUESTING CAMERA' : 'START GAME'}
            </button>
            {loading && <LoadingSpinner label="Waiting for camera access" />}
            <div className="h-2" />
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-white/40 gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Icon name="videocam" className="text-white/60 text-base" />
            <span>Camera Access: <span className="text-green-400 font-bold">Ready</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="volume_up" className="text-white/60 text-base" />
            <span>Audio: <span className="text-green-400 font-bold">On</span></span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>v1.0.4</span>
        </div>
      </footer>
    </div>
  );
}
