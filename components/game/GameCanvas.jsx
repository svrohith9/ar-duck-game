import { useCallback, useEffect, useRef, useState } from 'react';
import useGameStore from '../../store/gameStore';
import { usePoseDetection } from '../../hooks/usePoseDetection';
import { useDuckSpawner } from '../../hooks/useDuckSpawner';
import { loadDuckAssets } from '../../lib/assetManager';

const TARGET_POINTS = ['nose', 'left_eye', 'right_eye'];

export default function GameCanvas({ onGameOver, onShoot }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { detectorRef, faceDetectorRef, initDetectors } = usePoseDetection();
  const { ducksRef, reset: resetDucks, update: updateDucks } = useDuckSpawner();
  const [floatingText, setFloatingText] = useState([]);
  const lastFrameRef = useRef(0);
  const scoreTickRef = useRef(0);
  const poseRef = useRef(null);
  const frameBusyRef = useRef(false);
  const faceStrideRef = useRef(0);
  const assetsRef = useRef(null);
  const pausedRef = useRef(false);
  const rafRef = useRef(null);
  const accumulatorRef = useRef(0);
  const lastTimeRef = useRef(0);
  const dprRef = useRef(1);
  const videoTrackRef = useRef(null);

  const {
    loseLife,
    addScore,
    endGame,
    setTracking,
    paused,
  } = useGameStore();

  const initCamera = useCallback(async () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetWidth = Math.min(Math.floor(window.innerWidth * dpr), 1920);
    const targetHeight = Math.min(Math.floor(window.innerHeight * dpr), 1080);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: targetWidth },
        height: { ideal: targetHeight },
        frameRate: { ideal: 30, max: 60 },
        facingMode: 'user',
      },
      audio: false,
    });

    videoRef.current.srcObject = stream;
    const [track] = stream.getVideoTracks();
    videoTrackRef.current = track || null;
    await new Promise((resolve) => {
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        resolve();
      };
    });
  }, []);

  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    dprRef.current = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dprRef.current;
    canvas.height = canvas.clientHeight * dprRef.current;
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);

    if (videoTrackRef.current?.applyConstraints) {
      const targetWidth = Math.min(Math.floor(canvas.clientWidth * dprRef.current), 1920);
      const targetHeight = Math.min(Math.floor(canvas.clientHeight * dprRef.current), 1080);
      videoTrackRef.current.applyConstraints({
        width: { ideal: targetWidth },
        height: { ideal: targetHeight },
        frameRate: { ideal: 30, max: 60 },
      }).catch(() => {});
    }
  }, []);

  const drawVideo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    const vw = videoRef.current.videoWidth || canvas.clientWidth;
    const vh = videoRef.current.videoHeight || canvas.clientHeight;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const videoAspect = vw / vh;
    const canvasAspect = cw / ch;

    let drawW = cw;
    let drawH = ch;
    let dx = 0;
    let dy = 0;

    if (videoAspect > canvasAspect) {
      drawH = ch;
      drawW = ch * videoAspect;
      dx = (cw - drawW) / 2;
    } else {
      drawW = cw;
      drawH = cw / videoAspect;
      dy = (ch - drawH) / 2;
    }

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, -(dx + drawW), dy, drawW, drawH);
    ctx.restore();
  }, []);

  const renderFace = useCallback((face) => {
    if (!face || !face.keypoints) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const scaleX = canvas.clientWidth / videoRef.current.videoWidth;
    const scaleY = canvas.clientHeight / videoRef.current.videoHeight;
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
    const scaleX = canvas.clientWidth / videoRef.current.videoWidth;
    const scaleY = canvas.clientHeight / videoRef.current.videoHeight;
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
    ctx.imageSmoothingEnabled = true;

    ducksRef.current.forEach((duck) => {
      if (!duck.active || duck.despawning) return;
      const size = 128 * duck.scale;
      if (duck.shadow) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.drawImage(duck.shadow, duck.x - 32, duck.shadowY - 16, 64, 64);
        ctx.restore();
      }
      if (duck.image) {
        ctx.save();
        ctx.translate(duck.x, duck.y);
        ctx.rotate((duck.rotation * Math.PI) / 180);
        ctx.drawImage(duck.image, -size / 2, -size / 2, size, size);
        ctx.restore();
      }
    });
  }, [ducksRef]);

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
    const scaleX = canvas.clientWidth / videoRef.current.videoWidth;
    const scaleY = canvas.clientHeight / videoRef.current.videoHeight;

    ducksRef.current.forEach((duck) => {
      if (!duck.active || duck.despawning) return;
      const hit = points.some((point) => {
        const px = point.x * scaleX;
        const py = point.y * scaleY;
        const dx = duck.x - px;
        const dy = duck.y - py;
        const duckRadius = 64 * duck.scale;
        return Math.hypot(dx, dy) < hitRadius + duckRadius * 0.9;
      });
      if (hit) {
        duck.despawning = true;
        const currentLives = useGameStore.getState().lives;
        const nextLives = currentLives - 1;
        loseLife();
        if (nextLives <= 0) {
          endGame();
          onGameOver();
        }
      }
    });
  }, [ducksRef, endGame, getTargetPoints, loseLife, onGameOver]);

  const addFloatingText = useCallback((label) => {
    setFloatingText((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, label, x: '50%', y: '40%' },
    ]);
    setTimeout(() => {
      setFloatingText((prev) => prev.slice(1));
    }, 1200);
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    updateCanvasSize();
    lastTimeRef.current = 0;
    accumulatorRef.current = 0;

    const loop = async (time) => {
      rafRef.current = requestAnimationFrame(loop);
      if (!videoRef.current || !detectorRef.current || !assetsRef.current) return;
      if (frameBusyRef.current) return;

      let dt = time - (lastTimeRef.current || time);
      lastTimeRef.current = time;
      if (dt > 100) dt = 16.67;
      accumulatorRef.current += dt;

      frameBusyRef.current = true;
      try {
        while (accumulatorRef.current >= 16.67) {
          if (!pausedRef.current) {
            const poseResults = await detectorRef.current.estimatePoses(videoRef.current, { flipHorizontal: true });
            const pose = poseResults[0];
            poseRef.current = pose || null;

            let face = null;
            if (faceDetectorRef.current) {
              faceStrideRef.current += 1;
              if (faceStrideRef.current % 2 === 0) {
                const faces = await faceDetectorRef.current.estimateFaces(videoRef.current, { flipHorizontal: true });
                face = faces[0] || null;
              }
            }

            drawVideo();
            updateDucks(16.67, canvas.clientHeight, canvas.clientWidth, assetsRef.current);
            renderDucks();
            renderTrackingPoints(pose, time);
            renderFace(face);
            checkCollisions();

            scoreTickRef.current += 16.67;
            if (scoreTickRef.current >= 1000) {
              addScore(10);
              scoreTickRef.current = 0;
            }
          }

          accumulatorRef.current -= 16.67;
        }
      } catch (error) {
        console.error('Detection error:', error);
      } finally {
        frameBusyRef.current = false;
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [addScore, checkCollisions, drawVideo, renderDucks, renderFace, renderTrackingPoints, updateDucks, updateCanvasSize]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const assets = await loadDuckAssets();
        assetsRef.current = assets;
        await initCamera();
        const detectors = await initDetectors();
        if (mounted && detectors?.detector) setTracking(true);
      } catch (error) {
        console.error('Camera init failed:', error);
        if (mounted) setTracking(false);
      }
    };
    init();
    updateCanvasSize();

    let observer = null;
    if (window.ResizeObserver) {
      observer = new ResizeObserver(() => updateCanvasSize());
      if (canvasRef.current?.parentElement) {
        observer.observe(canvasRef.current.parentElement);
      } else {
        observer.observe(canvasRef.current);
      }
    } else {
      window.addEventListener('resize', updateCanvasSize);
    }
    return () => {
      mounted = false;
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateCanvasSize);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
      setTracking(false);
    };
  }, [initCamera, initDetectors, setTracking, updateCanvasSize]);

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
