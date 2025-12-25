export default function LoadingSpinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center gap-2 text-xs text-white/70">
      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      <span>{label}</span>
    </div>
  );
}
