import Icon from './ui/Icon';
import useGameStore from '../store/gameStore';
import Crosshair from './game/Crosshair';
import RadarMap from './game/RadarMap';

export default function GameplayHUD({ ducks, onPause }) {
  const { lives, score, wave } = useGameStore();
  const hearts = Array.from({ length: 3 });

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <div className="relative flex flex-col justify-between h-full w-full p-4 md:px-10 md:py-6">
        <div className="flex items-start justify-between pointer-events-auto w-full">
          <div className="flex flex-col gap-3 min-w-[120px]">
            <div className="bg-black/40 backdrop-blur-md text-white px-5 py-2 rounded-full flex items-center gap-3 border border-white/10 shadow-lg w-fit">
              <Icon name="waves" className="text-primary text-lg" />
              <span className="font-bold tracking-wide text-sm">WAVE {wave}</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 absolute left-1/2 -translate-x-1/2 top-0 pt-2 md:pt-6">
            <div className="bg-black/50 backdrop-blur-md text-white px-6 py-2 rounded-full shadow-xl border border-white/10 flex items-center gap-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">LIVES</span>
              <div className="flex gap-1 text-red-500 drop-shadow-md">
                {hearts.map((_, index) => (
                  <Icon
                    key={`life-${index}`}
                    name="favorite"
                    filled
                    className={index < lives ? 'text-red-500 text-lg' : 'text-white/20 text-lg'}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center group cursor-default">
              <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] tracking-tighter leading-none">
                {score.toLocaleString()}
              </h1>
              <p className="text-[10px] md:text-xs font-bold text-white/70 uppercase tracking-[0.2em] mt-1">Current Score</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-4 min-w-[120px]">
            <button
              onClick={onPause}
              className="bg-black/40 hover:bg-black/60 backdrop-blur-md text-white w-12 h-12 rounded-full border border-white/10 transition-all hover:scale-105 active:scale-95 flex items-center justify-center shadow-lg group"
            >
              <Icon name="pause" className="group-hover:text-primary" />
            </button>
            <div className="hidden lg:flex bg-black/40 backdrop-blur-sm p-3 rounded-2xl border border-white/5 max-w-[180px]">
              <p className="text-xs text-white/80 leading-relaxed text-right">
                <span className="text-primary font-bold block mb-1">MISSION</span>
                Dodge the ducks and survive the wave.
              </p>
            </div>
          </div>
        </div>

        {/* Crosshair removed per request */}

        <div className="flex items-end justify-between w-full pointer-events-auto relative z-20">
          <RadarMap ducks={ducks} />
          <div className="md:hidden w-10" />
          <div className="flex-1" />
        </div>
      </div>
    </div>
  );
}
