import Icon from '../ui/Icon';

export default function Footer() {
  return (
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
  );
}
