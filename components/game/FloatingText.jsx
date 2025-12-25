export default function FloatingText({ entries = [] }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="absolute float-text text-primary font-black text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          style={{ left: entry.x, top: entry.y }}
        >
          {entry.label}
        </div>
      ))}
    </div>
  );
}
