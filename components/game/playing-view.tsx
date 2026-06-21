"use client";

import { useCallback } from "react";

import { getGameSession } from "@/lib/supabase/game";

import { GameTimer } from "./game-timer";
import { LifeDisplay } from "./life-display";

type GameSession = Awaited<ReturnType<typeof getGameSession>>;

interface PlayingViewProps {
  session: GameSession;
  /** 방장 여부 — 타이머 만료 시 투표 전환 호출 주체 */
  isOwner: boolean;
}

/**
 * 게임 진행 화면.
 * 스크린샷 참고: 어두운 배경, 중앙 MM:SS 타이머, 타이머 아래 녹색 점(라이프).
 */
export function PlayingView({ session, isOwner }: PlayingViewProps) {
  const handleTimerExpired = useCallback(async () => {
    if (!isOwner) return;
    try {
      await fetch(`/api/games/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vote" }),
      });
    } catch {
      // 실패 시 다른 클라이언트가 처리하거나 수동 처리
    }
  }, [session.id, isOwner]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#3a3a3a]">
      <div className="flex flex-col items-center gap-6">
        <GameTimer endTime={session.end_time} onExpired={handleTimerExpired} />
        <LifeDisplay teamLife={session.team_life ?? 0} />
      </div>
    </main>
  );
}
