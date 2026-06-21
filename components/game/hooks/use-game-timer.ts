"use client";

import { useEffect, useState } from "react";

interface UseGameTimerResult {
  remainingMs: number;
  isExpired: boolean;
}

/**
 * 서버의 end_time 기준 카운트다운 훅.
 * 매 tick마다 Date.now()를 재계산하므로 누적 drift가 없다.
 */
export function useGameTimer(endTime: string | null): UseGameTimerResult {
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    if (!endTime) return 0;
    return Math.max(0, new Date(endTime).getTime() - Date.now());
  });

  useEffect(() => {
    if (!endTime) {
      setRemainingMs(0);
      return;
    }

    const tick = () => {
      setRemainingMs(Math.max(0, new Date(endTime).getTime() - Date.now()));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return {
    remainingMs,
    isExpired: remainingMs === 0 && endTime !== null,
  };
}
