# Escape Ducks

A camera‑driven dodge game where you move in real life to survive a rain of ducks. Built for macOS browsers with real‑time pose + face tracking and a minimalist sports‑tech UI.

## Product highlights
- **Human‑as‑controller**: Your hips drive the player ring for natural left/right movement.
- **Real‑time vision**: BlazePose Heavy + FaceMesh overlays for instant feedback.
- **Performance‑first**: WebGL acceleration, frame skip logic, and adaptive model switching.
- **Polished UX**: Clean, focused UI that keeps gameplay front and center.

## Gameplay
- **Objective**: Dodge falling ducks as long as possible.
- **Lives**: 3 hits and the round ends.
- **Score**: Survival time drives score.

## Controls
- **Move**: Shift your body left/right (hip tracking).
- **Start**: Click “Start Tracking.”
- **Restart**: Click “Restart Round.”

## Run locally
```bash
cd ar-duck-game
npm install
npm run dev
```
Open `http://localhost:3000` and allow camera access.

## Production notes
- Tested on macOS with Safari/Chrome.
- Camera access requires a secure context (localhost or HTTPS).
- All tracking is local; no video is sent to a server.

## Tech stack
- Next.js 14 + React 18
- MediaPipe BlazePose (heavy) for body tracking
- MediaPipe FaceMesh for facial landmarks
- Canvas render loop with live camera background
