export default function RadarMap({ ducks = [] }) {
  return (
    <div className="hidden md:flex flex-col gap-2 items-start">
      <div className="w-28 h-28 rounded-full bg-black/40 backdrop-blur-md border border-white/20 relative overflow-hidden flex items-center justify-center shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:10px_10px] opacity-20" />
        <div className="absolute inset-0 border border-white/10 rounded-full scale-50" />
        <div className="absolute w-1/2 h-full right-0 bg-gradient-to-l from-primary/30 to-transparent origin-left animate-[spin_4s_linear_infinite] rounded-r-full" />
        {ducks.slice(0, 6).map((duck, index) => (
          <div
            key={`radar-${index}`}
            className="absolute w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"
            style={{
              left: `${10 + (index % 3) * 18}px`,
              top: `${10 + Math.floor(index / 3) * 18}px`,
            }}
          >
            <div className="absolute inset-0 bg-red-500 rounded-full radar-blip" />
          </div>
        ))}
        <div className="w-1.5 h-1.5 bg-primary rounded-full z-10" />
      </div>
      <span className="text-[10px] font-bold text-white/60 ml-4 tracking-widest uppercase">Radar</span>
    </div>
  );
}
