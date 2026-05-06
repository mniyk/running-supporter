import { useState, useEffect, useRef } from 'react';
import { useGeolocation } from './hooks/useGeolocation';
import { useWakeLock } from './hooks/useWakeLock';
import { useSpeech, type AnnounceInterval } from './hooks/useSpeech';
import { formatDistance, formatTime } from './lib/format';

const INTERVALS: AnnounceInterval[] = [50, 100, 200, 500];
const UNLOCK_HOLD_MS = 3000;
const RING_R = 44;
const RING_C = 2 * Math.PI * RING_R;

export default function App() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [announceInterval, setAnnounceInterval] = useState<AnnounceInterval>(100);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [locked, setLocked] = useState(false);
  const [unlockProgress, setUnlockProgress] = useState(0);

  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartRef = useRef(0);

  const { totalDistance, error, reset: resetGeo } = useGeolocation(running);
  const { supported: wakeLockSupported } = useWakeLock(running);
  const { unlockAudio } = useSpeech({
    distance: totalDistance,
    interval: announceInterval,
    enabled: speechEnabled,
  });

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const handleStart = () => {
    unlockAudio();
    setRunning(true);
  };

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };

  const handleStop = () => {
    setRunning(false);
    setLocked(false);
    exitFullscreen();
  };

  const handleReset = () => {
    setRunning(false);
    setLocked(false);
    exitFullscreen();
    resetGeo();
    setElapsed(0);
  };

  const handleHoldStart = () => {
    holdStartRef.current = Date.now();
    holdTimerRef.current = setInterval(() => {
      const ms = Date.now() - holdStartRef.current;
      const progress = Math.min(ms / UNLOCK_HOLD_MS, 1);
      setUnlockProgress(progress);
      if (progress >= 1) {
        clearInterval(holdTimerRef.current!);
        holdTimerRef.current = null;
        setLocked(false);
        setUnlockProgress(0);
        exitFullscreen();
      }
    }, 50);
  };

  const handleHoldEnd = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setUnlockProgress(0);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-between px-6 py-8 select-none">

      {/* ===== ロックオーバーレイ ===== */}
      {locked && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-between py-20 touch-none">
          {/* 距離・時間 */}
          <div className="flex flex-col items-center gap-6 mt-12">
            <div className="text-8xl font-bold tabular-nums tracking-tight leading-none">
              {formatDistance(totalDistance)}
            </div>
            <div className="text-4xl text-gray-400 tabular-nums font-mono">
              {formatTime(elapsed)}
            </div>
          </div>

          {/* 解除ボタン */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-gray-500 text-sm">長押しで解除</p>
            <div
              className="relative w-28 h-28 cursor-pointer"
              onPointerDown={handleHoldStart}
              onPointerUp={handleHoldEnd}
              onPointerLeave={handleHoldEnd}
              onPointerCancel={handleHoldEnd}
            >
              {/* 進捗リング */}
              <svg width="112" height="112" className="absolute inset-0 -rotate-90">
                <circle cx="56" cy="56" r={RING_R} fill="none" stroke="#1f2937" strokeWidth="8" />
                <circle
                  cx="56" cy="56" r={RING_R}
                  fill="none" stroke="#3b82f6" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - unlockProgress)}
                />
              </svg>
              {/* 中央テキスト */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-xs text-gray-400">ロック中</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 通常画面 ===== */}

      {/* 距離・時間 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="text-8xl font-bold tabular-nums tracking-tight leading-none">
          {formatDistance(totalDistance)}
        </div>
        <div className="text-4xl text-gray-400 tabular-nums font-mono">
          {formatTime(elapsed)}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className={`w-2.5 h-2.5 rounded-full ${running ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-gray-500 text-sm">{running ? 'GPS 計測中' : '停止中'}</span>
        </div>
      </div>

      {/* アラート */}
      <div className="w-full max-w-sm space-y-2 mb-4">
        {!wakeLockSupported && running && (
          <p className="text-yellow-400 text-sm text-center">画面をオフにしないでください</p>
        )}
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>

      {/* コントロールボタン */}
      <div className="w-full max-w-sm flex gap-3 mb-3">
        <button
          onClick={handleStart}
          disabled={running}
          className="flex-1 h-16 rounded-2xl text-xl font-bold transition-colors bg-green-500 hover:bg-green-400 disabled:bg-gray-800 disabled:text-gray-600 active:scale-95"
        >
          スタート
        </button>
        <button
          onClick={handleStop}
          disabled={!running}
          className="flex-1 h-16 rounded-2xl text-xl font-bold transition-colors bg-orange-500 hover:bg-orange-400 disabled:bg-gray-800 disabled:text-gray-600 active:scale-95"
        >
          ストップ
        </button>
        <button
          onClick={handleReset}
          className="w-20 h-16 rounded-2xl text-base font-bold transition-colors bg-gray-700 hover:bg-gray-600 active:scale-95"
        >
          リセット
        </button>
      </div>

      {/* 画面ロックボタン（走行中のみ表示） */}
      {running && (
        <div className="w-full max-w-sm mb-3">
          <button
            onClick={() => { setLocked(true); enterFullscreen(); }}
            className="w-full h-12 rounded-2xl text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 active:scale-95 transition-colors flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            画面をロック（ポケット収納）
          </button>
        </div>
      )}

      {/* 設定 */}
      <div className="w-full max-w-sm space-y-5 bg-gray-900 rounded-2xl p-5">
        <div>
          <p className="text-gray-400 text-sm mb-3">アナウンス間隔</p>
          <div className="flex gap-2">
            {INTERVALS.map((v) => (
              <button
                key={v}
                onClick={() => setAnnounceInterval(v)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  announceInterval === v ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {v}m
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">音声アナウンス</span>
          <button
            onClick={() => setSpeechEnabled((e) => !e)}
            className={`relative w-12 h-6 rounded-full transition-colors ${speechEnabled ? 'bg-blue-500' : 'bg-gray-700'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${speechEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
