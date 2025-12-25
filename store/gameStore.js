import { create } from 'zustand';

const initialState = {
  screen: 'START',
  lives: 3,
  score: 0,
  wave: 1,
  streak: 0,
  accuracy: 0,
  ducksHit: 0,
  totalShots: 0,
  isTracking: false,
  hasCameraPermission: false,
  webXRSupported: false,
  audioEnabled: true,
  sfxVolume: 0.7,
  hapticFeedback: true,
  paused: false,
};

const useGameStore = create((set, get) => ({
  ...initialState,
  startGame: () => set({
    screen: 'GAMEPLAY',
    lives: 3,
    score: 0,
    wave: 1,
    streak: 0,
    accuracy: 0,
    ducksHit: 0,
    totalShots: 0,
    isTracking: true,
    paused: false,
  }),
  endGame: () => set({ screen: 'GAME_OVER', isTracking: false }),
  resetGame: () => set({ ...initialState }),
  setWebXRSupported: (value) => set({ webXRSupported: value }),
  setCameraPermission: (value) => set({ hasCameraPermission: value }),
  setTracking: (value) => set({ isTracking: value }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  loseLife: () => set((state) => ({ lives: Math.max(state.lives - 1, 0) })),
  recordShot: () => set((state) => ({ totalShots: state.totalShots + 1 })),
  hitDuck: (points, wasHeadshot) => set((state) => ({
    score: state.score + points,
    ducksHit: state.ducksHit + 1,
    streak: wasHeadshot ? state.streak + 1 : 0,
  })),
  updateAccuracy: () => set((state) => ({
    accuracy: state.totalShots > 0
      ? Math.round((state.ducksHit / state.totalShots) * 100)
      : 0,
  })),
  setWave: (wave) => set({ wave }),
  togglePause: () => set((state) => ({ paused: !state.paused })),
}));

export default useGameStore;
