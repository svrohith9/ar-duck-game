import { useCallback, useState } from 'react';

export function useCamera() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestCamera = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { max: 1280 },
          height: { max: 720 },
          frameRate: { max: 30 },
          facingMode: 'user',
        },
        audio: false,
      });
      setLoading(false);
      return { stream, error: null };
    } catch (err) {
      setLoading(false);
      setError(err);
      return { stream: null, error: err };
    }
  }, []);

  return { requestCamera, loading, error };
}
