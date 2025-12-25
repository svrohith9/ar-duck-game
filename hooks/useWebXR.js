import { useEffect, useState } from 'react';

export function useWebXR() {
  const [isSupported, setIsSupported] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;
    if ('xr' in navigator) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        if (mounted) setIsSupported(Boolean(supported));
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  const startXR = async () => {
    if (!('xr' in navigator)) return null;
    const xrSession = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test', 'dom-overlay'],
      domOverlay: { root: document.getElementById('ui-overlay') },
    });
    setSession(xrSession);
    return xrSession;
  };

  return { isSupported, session, startXR };
}
