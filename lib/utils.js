export function formatScore(value) {
  return Number(value || 0).toLocaleString();
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
