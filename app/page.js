'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Script from 'next/script';

const CONFIG = {
  modelType: 'heavy',
  enableTracking: true,
  camera: { width: 1280, height: 720, frameRate: 30 },
  detection: { flipHorizontal: true },
  face: { enabled: true, maxFaces: 1, refineLandmarks: true },
  performance: {
    lowFpsThreshold: 45,
    lowFpsWindowMs: 3000,
    frameSkipBelowFps: 60,
  },
  gesture: {
    cooldownMs: 500,
    smoothingAlpha: 0.4,
    confidenceMin: 0.4,
    punchVelocity: 1.6,
  },
};

const CONNECTIONS = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
];

export default function Page() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const flashRef = useRef(null);

  const detectorRef = useRef(null);
  const faceDetectorRef = useRef(null);
  const faceRef = useRef(null);

  const lastFrameRef = useRef(performance.now());
  const lastUiUpdateRef = useRef(0);
  const lowFpsSinceRef = useRef(null);
  const frameIndexRef = useRef(0);
  const animationIdRef = useRef(null);
  const isStreamingRef = useRef(false);
  const isRunningRef = useRef(false);
  const gameRef = useRef({
    ducks: [],
    lastSpawn: 0,
    lives: 3,
    score: 0,
    status: 'ready',
  });
  const playerRef = useRef({ x: 0.5, y: 0.85 });

  const [depsReady, setDepsReady] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [metrics, setMetrics] = useState({
    fps: 0,
    latency: 0,
    keypoints: 0,
    facePoints: 0,
    modelType: CONFIG.modelType,
  });
  const [gesture, setGesture] = useState('None');
  const [history, setHistory] = useState([]);
  const [perfMode, setPerfMode] = useState('quality');
  const [handDebug, setHandDebug] = useState({ left: '-', right: '-' });
  const [gameStats, setGameStats] = useState({ lives: 3, score: 0, status: 'ready' });

  const handleLibLoad = () => {
    // Keep for visibility, but readiness is based on globals below.
  };

  useEffect(() => {
    let rafId;
    const checkReady = () => {
      const tfReady = Boolean(window.tf);
      const poseReady = Boolean(window.poseDetection);
      if (tfReady && poseReady) {
        setDepsReady(true);
        return;
      }
      rafId = requestAnimationFrame(checkReady);
    };
    rafId = requestAnimationFrame(checkReady);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const updateUi = useCallback((next) => {
    const now = performance.now();
    if (now - lastUiUpdateRef.current < 100) return;
    lastUiUpdateRef.current = now;
    setMetrics((prev) => ({ ...prev, ...next }));
  }, []);

  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current || !stageRef.current) return;
    const { clientWidth, clientHeight } = stageRef.current;
    canvasRef.current.width = clientWidth;
    canvasRef.current.height = clientHeight;
  }, []);

  const ensureBackend = useCallback(async () => {
    if (!window.tf) return;
    try {
      await window.tf.setBackend('webgl');
      window.tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
      await window.tf.ready();
    } catch (error) {
      console.warn('TF backend setup failed:', error);
    }
  }, []);

  const initCamera = useCallback(async () => {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { max: CONFIG.camera.width },
          height: { max: CONFIG.camera.height },
          frameRate: { max: CONFIG.camera.frameRate },
          facingMode: 'user',
        },
        audio: false,
      });
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera access denied. Check System Settings > Privacy & Security > Camera.');
      }
      if (error.name === 'NotFoundError') {
        throw new Error('No camera found. Ensure your Mac camera is available.');
      }
      throw error;
    }

    videoRef.current.srcObject = stream;
    await new Promise((resolve) => {
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        resizeCanvas();
        resolve();
      };
    });
    isStreamingRef.current = true;
  }, [resizeCanvas]);

  const loadPoseDetector = useCallback(async (modelType) => {
    if (!window.poseDetection) throw new Error('Pose library not loaded.');
    detectorRef.current = await window.poseDetection.createDetector(
      window.poseDetection.SupportedModels.BlazePose,
      {
        runtime: 'mediapipe',
        modelType,
        enableTracking: CONFIG.enableTracking,
        smoothLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404',
      }
    );
    setMetrics((prev) => ({ ...prev, modelType }));
  }, []);

  const loadFaceDetector = useCallback(async () => {
    if (!CONFIG.face.enabled) return;
    if (!window.faceLandmarksDetection) return;
    faceDetectorRef.current = await window.faceLandmarksDetection.createDetector(
      window.faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      {
        runtime: 'mediapipe',
        refineLandmarks: CONFIG.face.refineLandmarks,
        maxFaces: CONFIG.face.maxFaces,
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619',
      }
    );
  }, []);

  const warmup = useCallback(async () => {
    if (!detectorRef.current) return;
    await detectorRef.current.estimatePoses(videoRef.current, { flipHorizontal: true });
    await detectorRef.current.estimatePoses(videoRef.current, { flipHorizontal: true });
    if (faceDetectorRef.current) {
      await faceDetectorRef.current.estimateFaces(videoRef.current, { flipHorizontal: true });
    }
  }, []);

  const drawVideoBackground = useCallback(() => {
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
    const stride = metrics.fps < 55 ? 6 : 3;
    ctx.fillStyle = '#66d9ff';
    for (let i = 0; i < face.keypoints.length; i += stride) {
      const point = face.keypoints[i];
      ctx.beginPath();
      ctx.arc(point.x * scaleX, point.y * scaleY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [metrics.fps]);

  const renderSkeleton = useCallback((pose) => {
    if (!pose) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const keypoints = pose.keypoints || [];
    const scaleX = canvas.width / videoRef.current.videoWidth;
    const scaleY = canvas.height / videoRef.current.videoHeight;

    ctx.strokeStyle = '#49f2c2';
    ctx.lineWidth = 4;
    CONNECTIONS.forEach(([start, end]) => {
      const startPoint = keypoints.find((k) => k.name === start);
      const endPoint = keypoints.find((k) => k.name === end);
      if (!startPoint || !endPoint) return;
      if (startPoint.score < 0.3 || endPoint.score < 0.3) return;
      ctx.beginPath();
      ctx.moveTo(startPoint.x * scaleX, startPoint.y * scaleY);
      ctx.lineTo(endPoint.x * scaleX, endPoint.y * scaleY);
      ctx.stroke();
    });

    const stride = metrics.fps < 50 ? 3 : 1;
    ctx.fillStyle = '#ff3d71';
    for (let i = 0; i < keypoints.length; i += stride) {
      const point = keypoints[i];
      if (point.score < 0.3) continue;
      ctx.beginPath();
      ctx.arc(point.x * scaleX, point.y * scaleY, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [metrics.fps]);

  const renderGame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { ducks } = gameRef.current;

    ducks.forEach((duck) => {
      ctx.fillStyle = '#f2b04a';
      ctx.beginPath();
      ctx.ellipse(duck.x, duck.y, duck.size * 1.2, duck.size, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff7a3d';
      ctx.beginPath();
      ctx.ellipse(duck.x + duck.size * 0.8, duck.y - duck.size * 0.2, duck.size * 0.4, duck.size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    const player = playerRef.current;
    ctx.strokeStyle = '#4ce7c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x * canvas.width, player.y * canvas.height, 18, 0, Math.PI * 2);
    ctx.stroke();
  }, []);

  const updatePlayerFromPose = useCallback((pose) => {
    if (!pose) return;
    const keypoints = pose.keypoints || [];
    const leftHip = keypoints.find((k) => k.name === 'left_hip');
    const rightHip = keypoints.find((k) => k.name === 'right_hip');
    const nose = keypoints.find((k) => k.name === 'nose');
    if (leftHip && rightHip && leftHip.score > 0.3 && rightHip.score > 0.3) {
      const centerX = (leftHip.x + rightHip.x) / 2;
      playerRef.current.x = centerX / videoRef.current.videoWidth;
    } else if (nose && nose.score > 0.3) {
      playerRef.current.x = nose.x / videoRef.current.videoWidth;
    }
  }, []);

  const spawnDuck = useCallback(() => {
    const canvas = canvasRef.current;
    const size = 12 + Math.random() * 12;
    gameRef.current.ducks.push({
      x: Math.random() * (canvas.width - size * 2) + size,
      y: -size * 2,
      size,
      speed: 90 + Math.random() * 140,
    });
  }, []);

  const resetGame = useCallback(() => {
    gameRef.current = { ducks: [], lastSpawn: 0, lives: 3, score: 0, status: 'playing' };
    setGameStats({ lives: 3, score: 0, status: 'playing' });
  }, []);

  const updateGame = useCallback((deltaMs) => {
    const game = gameRef.current;
    if (game.status !== 'playing') return;
    const canvas = canvasRef.current;
    const delta = deltaMs / 1000;

    game.lastSpawn += deltaMs;
    const spawnInterval = 600;
    if (game.lastSpawn > spawnInterval) {
      spawnDuck();
      game.lastSpawn = 0;
    }

    const playerX = playerRef.current.x * canvas.width;
    const playerY = playerRef.current.y * canvas.height;
    const hitRadius = 18;

    game.ducks = game.ducks.filter((duck) => {
      duck.y += duck.speed * delta;
      const dx = duck.x - playerX;
      const dy = duck.y - playerY;
      const hit = Math.hypot(dx, dy) < hitRadius + duck.size * 0.9;
      if (hit) {
        game.lives -= 1;
        return false;
      }
      return duck.y < canvas.height + duck.size * 2;
    });

    if (game.lives <= 0) {
      game.status = 'game-over';
    } else {
      game.score += deltaMs * 0.01;
    }

    setGameStats({
      lives: game.lives,
      score: Math.floor(game.score),
      status: game.status,
    });
  }, [spawnDuck]);

  const flash = useCallback(() => {
    if (!flashRef.current) return;
    flashRef.current.style.opacity = '1';
    setTimeout(() => {
      if (flashRef.current) flashRef.current.style.opacity = '0';
    }, 120);
  }, []);

  const recordGesture = useCallback((nextGesture) => {
    setHistory((prev) => {
      const updated = [`${nextGesture} @ ${new Date().toLocaleTimeString()}`, ...prev];
      return updated.slice(0, 5);
    });
  }, []);

  const processGestures = useCallback(() => {
    const cooldowns = new Map();
    const smoothing = new Map();
    const prevPoints = new Map();

    const smoothPoint = (name, point) => {
      const prev = smoothing.get(name);
      if (!prev) {
        smoothing.set(name, { x: point.x, y: point.y, score: point.score });
        return point;
      }
      const alpha = CONFIG.gesture.smoothingAlpha;
      const smoothed = {
        x: prev.x + (point.x - prev.x) * alpha,
        y: prev.y + (point.y - prev.y) * alpha,
        score: point.score,
      };
      smoothing.set(name, smoothed);
      return smoothed;
    };

    const normalize = (point, width, height) => ({
      x: (point.x / width) * 2 - 1,
      y: 1 - (point.y / height) * 2,
      score: point.score,
    });

    const velocity = (name, point, timestamp) => {
      const prev = prevPoints.get(name);
      prevPoints.set(name, { x: point.x, y: point.y, t: timestamp });
      if (!prev) return 0;
      const dt = Math.max((timestamp - prev.t) / 1000, 0.001);
      return Math.hypot(point.x - prev.x, point.y - prev.y) / dt;
    };

    const canTrigger = (gesture) => {
      const last = cooldowns.get(gesture) || 0;
      return performance.now() - last >= CONFIG.gesture.cooldownMs;
    };

    const markTrigger = (gesture) => {
      cooldowns.set(gesture, performance.now());
      recordGesture(gesture);
      flash();
      window.dispatchEvent(new CustomEvent('motion-control', { detail: { gesture, timestamp: Date.now() } }));
      window.dispatchEvent(new CustomEvent('motion-gesture', { detail: { gesture, timestamp: Date.now() } }));
    };

    return (pose) => {
      const keypoints = pose.keypoints || [];
      const lookup = (name) => keypoints.find((k) => k.name === name);
      const leftWristRaw = lookup('left_wrist');
      const rightWristRaw = lookup('right_wrist');
      const noseRaw = lookup('nose');
      if (!leftWristRaw || !rightWristRaw || !noseRaw) return;
      if (leftWristRaw.score < CONFIG.gesture.confidenceMin || rightWristRaw.score < CONFIG.gesture.confidenceMin) return;

      const leftWrist = smoothPoint('left_wrist', leftWristRaw);
      const rightWrist = smoothPoint('right_wrist', rightWristRaw);
      const nose = smoothPoint('nose', noseRaw);

      const left = normalize(leftWrist, videoRef.current.videoWidth, videoRef.current.videoHeight);
      const right = normalize(rightWrist, videoRef.current.videoWidth, videoRef.current.videoHeight);
      normalize(nose, videoRef.current.videoWidth, videoRef.current.videoHeight);

      setHandDebug({
        left: `(${left.x.toFixed(2)}, ${left.y.toFixed(2)})`,
        right: `(${right.x.toFixed(2)}, ${right.y.toFixed(2)})`,
      });

      const now = performance.now();
      const leftVel = velocity('left_wrist', left, now);
      const rightVel = velocity('right_wrist', right, now);

      let active = 'None';
      if (left.y > 0.5 && right.y > 0.5 && canTrigger('JUMP')) {
        active = 'JUMP';
        markTrigger('JUMP');
      } else if (left.y < -0.3 && right.y < -0.3 && canTrigger('DUCK')) {
        active = 'DUCK';
        markTrigger('DUCK');
      }

      if (left.x < -0.7 && canTrigger('MOVE_LEFT')) markTrigger('MOVE_LEFT');
      if (right.x > 0.7 && canTrigger('MOVE_RIGHT')) markTrigger('MOVE_RIGHT');

      const punchVelocity = Math.max(leftVel, rightVel);
      if (punchVelocity > CONFIG.gesture.punchVelocity && canTrigger('PUNCH')) {
        active = active === 'None' ? 'PUNCH' : active;
        markTrigger('PUNCH');
      }

      setGesture(active);
    };
  }, [flash, recordGesture]);

  const gestureHandlerRef = useRef(null);
  if (!gestureHandlerRef.current) gestureHandlerRef.current = processGestures();

  const handleModelSwitch = useCallback(async (fps) => {
    if (perfMode !== 'speed') return;
    if (fps < CONFIG.performance.lowFpsThreshold) {
      if (!lowFpsSinceRef.current) lowFpsSinceRef.current = performance.now();
      if (performance.now() - lowFpsSinceRef.current > CONFIG.performance.lowFpsWindowMs) {
        await loadPoseDetector('lite');
        lowFpsSinceRef.current = null;
      }
    } else {
      lowFpsSinceRef.current = null;
    }
  }, [perfMode, loadPoseDetector]);

  const processFrame = useCallback(async (now) => {
    if (!isStreamingRef.current || !detectorRef.current) return;

    const delta = now - lastFrameRef.current;
    const fps = Math.round(1000 / Math.max(delta, 1));
    lastFrameRef.current = now;
    frameIndexRef.current += 1;
    updateUi({ fps });

    const shouldSkip = fps < CONFIG.performance.frameSkipBelowFps && frameIndexRef.current % 2 === 0;
    if (!shouldSkip && videoRef.current.readyState === 4) {
      const start = performance.now();
      try {
        const poses = await detectorRef.current.estimatePoses(videoRef.current, {
          flipHorizontal: CONFIG.detection.flipHorizontal,
        });
        const latency = performance.now() - start;

        let pose = null;
        if (poses.length) {
          pose = poses[0];
          setStatus('Tracking');
          updateUi({ keypoints: pose.keypoints.length, latency });
          gestureHandlerRef.current(pose);
          updatePlayerFromPose(pose);
          await handleModelSwitch(fps);
        } else {
          setStatus('No person detected');
          updateUi({ keypoints: 0, latency });
        }

        if (faceDetectorRef.current) {
          const faceStride = fps < 55 ? 2 : 1;
          if (frameIndexRef.current % faceStride === 0) {
            const faces = await faceDetectorRef.current.estimateFaces(videoRef.current, {
              flipHorizontal: CONFIG.detection.flipHorizontal,
            });
            faceRef.current = faces[0] || null;
            updateUi({ facePoints: faceRef.current?.keypoints?.length || 0 });
          }
        }

        drawVideoBackground();
        updateGame(delta);
        renderGame();
        renderSkeleton(pose);
        renderFace(faceRef.current);
      } catch (error) {
        console.error('Detection error:', error);
      }
    }

    if (videoRef.current.requestVideoFrameCallback) {
      videoRef.current.requestVideoFrameCallback(processFrame);
    } else {
      animationIdRef.current = requestAnimationFrame(processFrame);
    }
  }, [drawVideoBackground, handleModelSwitch, renderFace, renderGame, renderSkeleton, updateGame, updatePlayerFromPose, updateUi]);

  const initMotionTracker = useCallback(async () => {
    if (isRunningRef.current) return;
    if (!depsReady) {
      setStatus('Loading libraries...'); 
      return;
    }
    isRunningRef.current = true;
    setStatus('Initializing...');

    try {
      await ensureBackend();
      await initCamera();
      await loadPoseDetector(CONFIG.modelType);
      await loadFaceDetector();
      await warmup();
      setStatus('Tracking');
      resetGame();

      if (videoRef.current.requestVideoFrameCallback) {
        videoRef.current.requestVideoFrameCallback(processFrame);
      } else {
        animationIdRef.current = requestAnimationFrame(processFrame);
      }
    } catch (error) {
      console.error('Initialization failed:', error);
      setStatus(`Error: ${error.message}`);
      isRunningRef.current = false;
    }
  }, [depsReady, ensureBackend, initCamera, loadFaceDetector, loadPoseDetector, processFrame, warmup]);

  const stopMotionTracker = useCallback(() => {
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    isStreamingRef.current = false;
    isRunningRef.current = false;
    setStatus('Stopped');
    gameRef.current.status = 'paused';
    setGameStats((prev) => ({ ...prev, status: 'paused' }));
  }, []);

  useEffect(() => {
    resizeCanvas();
    const handleResize = () => resizeCanvas();
    const handleVisibility = () => {
      if (document.hidden) stopMotionTracker();
    };
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      stopMotionTracker();
    };
  }, [resizeCanvas, stopMotionTracker]);

  return (
    <div className="app">
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.13.0" strategy="afterInteractive" onLoad={handleLibLoad} />
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@4.13.0" strategy="afterInteractive" onLoad={handleLibLoad} />
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.13.0" strategy="afterInteractive" onLoad={handleLibLoad} />
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0" strategy="afterInteractive" onLoad={handleLibLoad} />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404" strategy="afterInteractive" onLoad={handleLibLoad} />
      <Script src="https://unpkg.com/@tensorflow-models/face-landmarks-detection@1.0.3/dist/face-landmarks-detection.min.js" strategy="afterInteractive" onLoad={handleLibLoad} />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619" strategy="afterInteractive" onLoad={handleLibLoad} />

      <aside className="sidebar">
        <div>
          <div className="brand">StrideLab</div>
          <div className="tagline">Live motion intelligence for sports training</div>
        </div>

        <div className="panel">
          <h3>Game</h3>
          <div className="metric">Lives <span>{gameStats.lives}</span></div>
          <div className="metric">Score <span>{gameStats.score}</span></div>
          <div className="metric">State <span>{gameStats.status}</span></div>
          <div className="controls">
            <button className="button secondary" onClick={resetGame}>Restart Round</button>
          </div>
        </div>

        <div className="panel">
          <h3>System Metrics</h3>
          <div className="metric">FPS <span>{metrics.fps}</span></div>
          <div className="metric">Latency <span>{metrics.latency.toFixed(1)}ms</span></div>
          <div className="metric">Pose Points <span>{metrics.keypoints}</span></div>
          <div className="metric">Face Points <span>{metrics.facePoints}</span></div>
          <div className="metric">Model <span>{metrics.modelType}</span></div>
        </div>

        <div className="panel">
          <h3>Controls</h3>
          <div className="controls">
            <button className="button" onClick={initMotionTracker}>Start Tracking</button>
            <button className="button secondary" onClick={stopMotionTracker}>Stop</button>
            <select className="select" value={perfMode} onChange={(e) => setPerfMode(e.target.value)}>
              <option value="quality">Quality Mode</option>
              <option value="speed">Speed Mode</option>
            </select>
            <div className="badge">Libraries: {depsReady ? 'Ready' : 'Loading...'}</div>
          </div>
        </div>

        <div className="panel">
          <h3>Gesture Feed</h3>
          <div className="metric">Active <span>{gesture}</span></div>
          <div className="metric">Left Hand <span>{handDebug.left}</span></div>
          <div className="metric">Right Hand <span>{handDebug.right}</span></div>
          <div className="history">{history.length ? history.join(', ') : 'No gestures yet.'}</div>
        </div>

        <div className="panel">
          <h3>Status</h3>
          <div className="metric">System <span>{status}</span></div>
        </div>
      </aside>

      <section className="stage" ref={stageRef}>
        <video ref={videoRef} className="video" autoPlay playsInline />
        <canvas ref={canvasRef} className="canvas" />
        <div ref={flashRef} className="flash" />
        <div className="overlay">Calibrated for macOS M1/M2 • BlazePose Heavy</div>
      </section>
    </div>
  );
}
