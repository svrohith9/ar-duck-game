export default function Crosshair() {
  return (
    <div className="relative flex items-center justify-center opacity-90">
      <svg
        className="text-primary drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] crosshair-rotate"
        fill="none"
        height="64"
        viewBox="0 0 100 100"
        width="64"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="48" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1.5" />
        <circle cx="50" cy="50" fill="white" r="2" />
        <path d="M50 15V35 M50 65V85 M15 50H35 M65 50H85" stroke="white" strokeLinecap="round" strokeWidth="2" />
      </svg>
      <div className="absolute w-32 h-32 border border-white/30 rounded-xl" />
      <div className="absolute w-36 h-36 border-x border-white/20 rounded-xl" />
    </div>
  );
}
