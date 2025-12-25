export default function Icon({ name, className = '', filled = false, ...props }) {
  const filledClass = filled ? 'material-symbols-filled' : '';
  return (
    <span className={`material-symbols-outlined ${filledClass} ${className}`.trim()} {...props}>
      {name}
    </span>
  );
}
