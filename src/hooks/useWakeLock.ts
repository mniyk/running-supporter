import { useEffect, useRef } from 'react';

export function useWakeLock(active: boolean) {
  const supported = 'wakeLock' in navigator;
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!supported || !active) return;

    const acquire = () => {
      navigator.wakeLock
        .request('screen')
        .then((lock) => {
          lockRef.current = lock;
        })
        .catch(console.warn);
    };

    acquire();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') acquire();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      lockRef.current?.release().then(() => {
        lockRef.current = null;
      });
    };
  }, [active, supported]);

  return { supported };
}
