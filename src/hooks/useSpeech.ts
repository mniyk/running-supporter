import { useEffect, useRef } from 'react';
import { toJapanese } from '../lib/distance';

export type AnnounceInterval = 50 | 100 | 200 | 500;

export function useSpeech({
  distance,
  interval,
  enabled,
}: {
  distance: number;
  interval: AnnounceInterval;
  enabled: boolean;
}) {
  const announcedUpTo = useRef(0);
  const prevInterval = useRef(interval);

  const unlockAudio = () => {
    const utter = new SpeechSynthesisUtterance(' ');
    utter.volume = 0.01;
    utter.lang = 'ja-JP';
    window.speechSynthesis.speak(utter);
  };

  // When interval changes, re-align announcedUpTo to avoid skipping thresholds
  useEffect(() => {
    if (prevInterval.current !== interval) {
      announcedUpTo.current = Math.floor(distance / interval) * interval;
      prevInterval.current = interval;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval]);

  // Reset when distance resets to 0
  useEffect(() => {
    if (distance === 0) announcedUpTo.current = 0;
  }, [distance]);

  // Announce all newly crossed thresholds
  useEffect(() => {
    let next = announcedUpTo.current + interval;
    while (distance >= next) {
      if (enabled) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(toJapanese(next));
        utter.lang = 'ja-JP';
        utter.rate = 1.0;
        window.speechSynthesis.speak(utter);
      }
      announcedUpTo.current = next;
      next += interval;
    }
  }, [distance, interval, enabled]);

  return { unlockAudio };
}
