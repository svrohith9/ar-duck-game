export default function PrimaryButton({ className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`group relative flex items-center justify-center bg-primary hover:bg-primary-hover text-background-dark font-black tracking-tight rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
