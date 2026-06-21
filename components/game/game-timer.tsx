"use client";

import { useEffect, useRef } from "react";

import { useGameTimer } from "./hooks/use-game-timer";

interface GameTimerProps {
  /** 게임 종료 서버 시각 (ISO timestamp) */
  endTime: string | null;
  /** 타이머 만료 시 1회만 호출되는 콜백 */
  onExpired?: () => void;
}

/**
 * 서버 end_time 기준 카운트다운 타이머.
 * 스크린샷 참고: MM:SS 형식, 흰색 대형 텍스트.
 */
export function GameTimer({ endTime, onExpired }: GameTimerProps) {
  const { remainingMs, isExpired } = useGameTimer(endTime);
  const hasCalledExpiredRef = useRef(false);

  useEffect(() => {
    if (isExpired && !hasCalledExpiredRef.current) {
      hasCalledExpiredRef.current = true;
      onExpired?.();
    }
  }, [isExpired, onExpired]);

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <span
      className="font-mono text-7xl font-bold tabular-nums text-white md:text-8xl"
      role="timer"
      aria-label={`남은 시간 ${display}`}
    >
      {display}
    </span>
  );
}
