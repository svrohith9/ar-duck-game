import GlassPanel from '../ui/GlassPanel';
import Icon from '../ui/Icon';

export default function Header() {
  return (
    <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-full">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-background-dark">
          <Icon name="videogame_asset" className="text-lg" />
        </div>
        <h1 className="font-bold text-lg tracking-tight hidden sm:block">AR DUCK HUNT</h1>
      </div>
      <div className="flex items-center gap-4">
        <GlassPanel className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-white/70">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          WebXR Ready
        </GlassPanel>
        <button className="flex items-center gap-2 px-4 py-2 bg-surface-dark hover:bg-surface-dark/80 border border-white/10 rounded-full transition-colors text-sm font-semibold">
          <Icon name="account_balance_wallet" className="text-primary text-lg" />
          <span>Connect Wallet</span>
        </button>
      </div>
    </header>
  );
}
