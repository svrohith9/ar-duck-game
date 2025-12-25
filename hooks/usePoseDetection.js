import { useCallback, useRef } from 'react';

export function usePoseDetection() {
  const detectorRef = useRef(null);
  const faceDetectorRef = useRef(null);

  const initDetectors = useCallback(async () => {
    let attempts = 0;
    while (!window.poseDetection && attempts < 100) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      attempts += 1;
    }
    if (!window.poseDetection) return null;
    detectorRef.current = await window.poseDetection.createDetector(
      window.poseDetection.SupportedModels.BlazePose,
      {
        runtime: 'mediapipe',
        modelType: 'heavy',
        enableTracking: true,
        smoothLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404',
      }
    );

    if (window.faceLandmarksDetection) {
      faceDetectorRef.current = await window.faceLandmarksDetection.createDetector(
        window.faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'mediapipe',
          refineLandmarks: true,
          maxFaces: 1,
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619',
        }
      );
    }

    return { detector: detectorRef.current, faceDetector: faceDetectorRef.current };
  }, []);

  return { detectorRef, faceDetectorRef, initDetectors };
}
