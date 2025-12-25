import Script from 'next/script';

export default function PoseTrackerScripts() {
  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.13.0" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@4.13.0" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.13.0" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.0" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404" strategy="afterInteractive" />
      <Script src="https://unpkg.com/@tensorflow-models/face-landmarks-detection@1.0.3/dist/face-landmarks-detection.min.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619" strategy="afterInteractive" />
    </>
  );
}
