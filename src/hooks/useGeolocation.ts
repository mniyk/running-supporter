import { useState, useEffect, useRef, useCallback } from 'react';
import { haversine } from '../lib/distance';

export function useGeolocation(running: boolean) {
  const [totalDistance, setTotalDistance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const lastPosRef = useRef<{ lat: number; lon: number } | null>(null);
  const runningRef = useRef(running);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  const reset = useCallback(() => {
    setTotalDistance(0);
    setError(null);
    lastPosRef.current = null;
  }, []);

  useEffect(() => {
    if (!running) return;

    if (!navigator.geolocation) {
      setError('位置情報が使用できません');
      return;
    }

    lastPosRef.current = null;

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        if (!runningRef.current) return;
        const { latitude, longitude, accuracy } = coords;

        if (accuracy > 20) return;

        if (lastPosRef.current) {
          const dist = haversine(lastPosRef.current.lat, lastPosRef.current.lon, latitude, longitude);
          if (dist < 5 || dist > 100) return;
          setTotalDistance((prev) => prev + dist);
        }

        lastPosRef.current = { lat: latitude, lon: longitude };
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [running]);

  return { totalDistance, error, reset };
}
