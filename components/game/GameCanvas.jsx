import { useCallback, useEffect, useRef, useState } from 'react';
import useGameStore from '../../store/gameStore';
import { useAnimationFrame } from '../../hooks/useAnimationFrame';
import { usePoseDetection } from '../../hooks/usePoseDetection';
import { useDuckSpawner } from './DuckSpawner';

const TARGET_POINTS = ['nose', 'left_eye', 'right_eye'];

export default function GameCanvas({ onGameOver, onShoot }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { detectorRef, faceDetectorRef, initDetectors } = usePoseDetection();
  const { ducks, reset: resetDucks, update: updateDucks } = useDuckSpawner();
  const [floatingText, setFloatingText] = useState([]);
  const lastFrameRef = useRef(0);
  const lastDomUpdateRef = useRef(0);
  const [domDucks, setDomDucks] = useState([]);
  const scoreTickRef = useRef(0);
  const poseRef = useRef(null);
  const frameBusyRef = useRef(false);
  const faceStrideRef = useRef(0);
  const resizeTimeoutRef = useRef(null);

  const {
    loseLife,
    addScore,
    endGame,
    setTracking,
    paused,
  } = useGameStore();

  const initCamera = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { max: 1280 },
        height: { max: 720 },
        frameRate: { max: 30 },
        facingMode: 'user',
      },
      audio: false,
    });

    videoRef.current.srcObject = stream;
    await new Promise((resolve) => {
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        resolve();
      };
    });
  }, []);

  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    canvasRef.current.width = window.innerWidth;
    canvasRef.current.height = window.innerHeight;
  }, []);

  const debouncedResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(resizeCanvas, 120);
  }, [resizeCanvas]);

  const drawVideo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
  }, []);

  const renderFace = useCallback((face) => {
    if (!face || !face.keypoints) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const scaleX = canvas.width / videoRef.current.videoWidth;
    const scaleY = canvas.height / videoRef.current.videoHeight;
    const stride = 4;
    ctx.fillStyle = '#66d9ff';
    for (let i = 0; i < face.keypoints.length; i += stride) {
      const point = face.keypoints[i];
      ctx.beginPath();
      ctx.arc(point.x * scaleX, point.y * scaleY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  const renderTrackingPoints = useCallback((pose, time) => {
    if (!pose?.keypoints) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const scaleX = canvas.width / videoRef.current.videoWidth;
    const scaleY = canvas.height / videoRef.current.videoHeight;
    const pulse = (Math.sin(time / 220) + 1) * 0.5;

    const nose = pose.keypoints.find((k) => k.name === 'nose');
    const leftEye = pose.keypoints.find((k) => k.name === 'left_eye');
    const rightEye = pose.keypoints.find((k) => k.name === 'right_eye');
    const points = [nose, leftEye, rightEye].filter((p) => p && p.score > 0.4);

    points.forEach((point) => {
      const x = point.x * scaleX;
      const y = point.y * scaleY;
      const base = 8;

      ctx.beginPath();
      ctx.fillStyle = 'rgba(249, 228, 6, 0.9)';
      ctx.arc(x, y, base, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = `rgba(249, 228, 6, ${0.2 + pulse * 0.6})`;
      ctx.lineWidth = 2;
      ctx.arc(x, y, base + 10 + pulse * 6, 0, Math.PI * 2);
      ctx.stroke();
    });
  }, []);

  const renderDucks = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ducks.current.forEach((duck) => {
      if (!duck.active) return;
      ctx.fillStyle = '#f9e406';
      ctx.beginPath();
      ctx.ellipse(duck.x, duck.y, duck.size * 1.2, duck.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff7a3d';
      ctx.beginPath();
      ctx.ellipse(duck.x + duck.size * 0.8, duck.y - duck.size * 0.2, duck.size * 0.4, duck.size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [ducks]);

  const getTargetPoints = useCallback((pose) => {
    if (!pose?.keypoints) return [];
    return TARGET_POINTS.map((name) => pose.keypoints.find((k) => k.name === name))
      .filter((point) => point && point.score > 0.4);
  }, []);

  const checkCollisions = useCallback(() => {
    const canvas = canvasRef.current;
    const points = getTargetPoints(poseRef.current);
    if (points.length === 0) return;
    const hitRadius = 14;
    const scaleX = canvas.width / videoRef.current.videoWidth;
    const scaleY = canvas.height / videoRef.current.videoHeight;

    ducks.current.forEach((duck) => {
      if (!duck.active) return;
      const hit = points.some((point) => {
        const px = point.x * scaleX;
        const py = point.y * scaleY;
        const dx = duck.x - px;
        const dy = duck.y - py;
        return Math.hypot(dx, dy) < hitRadius + duck.size * 0.9;
      });
      if (hit) {
        duck.active = false;
        const currentLives = useGameStore.getState().lives;
        const nextLives = currentLives - 1;
        loseLife();
        if (nextLives <= 0) {
          endGame();
          onGameOver();
        }
      }
    });
  }, [ducks, endGame, getTargetPoints, loseLife, onGameOver]);

  const addFloatingText = useCallback((label) => {
    setFloatingText((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, label, x: '50%', y: '40%' },
    ]);
    setTimeout(() => {
      setFloatingText((prev) => prev.slice(1));
    }, 1200);
  }, []);

  useAnimationFrame(async (delta, time) => {
    if (!videoRef.current || !canvasRef.current) return;
    if (!detectorRef.current) return;
    if (paused) return;
    if (frameBusyRef.current) return;
    frameBusyRef.current = true;

    try {
      const poseResults = await detectorRef.current.estimatePoses(videoRef.current, {
        flipHorizontal: true,
      });

      const pose = poseResults[0];
      poseRef.current = pose || null;

      let face = null;
      if (faceDetectorRef.current) {
        faceStrideRef.current += 1;
        if (faceStrideRef.current % 2 === 0) {
          const faces = await faceDetectorRef.current.estimateFaces(videoRef.current, {
            flipHorizontal: true,
          });
          face = faces[0] || null;
        }
      }

      drawVideo();
      updateDucks(delta, canvasRef.current.height, canvasRef.current.width);
      renderDucks();
      renderTrackingPoints(pose, time);
      renderFace(face);
      checkCollisions();

      if (time - lastDomUpdateRef.current > 120) {
        lastDomUpdateRef.current = time;
        setDomDucks(ducks.current.filter((duck) => duck.active).map((duck) => ({
          x: duck.x,
          y: duck.y,
          size: duck.size,
        })));
      }

      scoreTickRef.current += delta;
      if (scoreTickRef.current >= 1000) {
        addScore(10);
        scoreTickRef.current = 0;
      }
    } catch (error) {
      console.error('Detection error:', error);
    } finally {
      frameBusyRef.current = false;
    }
  }, { fpsCap: 60 });

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await initCamera();
        const detectors = await initDetectors();
        if (mounted && detectors?.detector) setTracking(true);
      } catch (error) {
        console.error('Camera init failed:', error);
        if (mounted) setTracking(false);
      }
    };
    init();
    resizeCanvas();
    window.addEventListener('resize', debouncedResize);
    return () => {
      mounted = false;
      window.removeEventListener('resize', debouncedResize);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
      setTracking(false);
    };
  }, [debouncedResize, initCamera, initDetectors, resizeCanvas, setTracking]);

  useEffect(() => {
    resetDucks();
  }, [resetDucks]);

  useEffect(() => {
    lastFrameRef.current = performance.now();
  }, []);

  const handleShoot = useCallback(() => {
    addScore(50);
    if (onShoot) onShoot();
    addFloatingText('+50');
  }, [addScore, addFloatingText, onShoot]);

  return (
    <div className="absolute inset-0 z-0">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover invisible" autoPlay playsInline />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
      {domDucks.map((duck, index) => (
        <div
          key={`duck-${index}`}
          className="duck-target absolute pointer-events-none"
          style={{
            width: `${duck.size * 2}px`,
            height: `${duck.size * 2}px`,
            left: `${duck.x - duck.size}px`,
            top: `${duck.y - duck.size}px`,
          }}
        >
          <div className="w-full h-full rounded-full bg-primary/60 shadow-[0_0_18px_rgba(249,228,6,0.4)]" />
        </div>
      ))}
      {floatingText.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {floatingText.map((entry) => (
            <div
              key={entry.id}
              className="absolute float-text text-primary font-black text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              style={{ left: entry.x, top: entry.y }}
            >
              {entry.label}
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={handleShoot}
        aria-label="Shoot"
        className="absolute inset-0 opacity-0"
      />
    </div>
  );
}
