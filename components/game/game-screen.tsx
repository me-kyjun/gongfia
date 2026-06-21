"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { getGameSession } from "@/lib/supabase/game";
import type { Database } from "@/types/database";

import { ConnectingView } from "./connecting-view";
import { useGameRealtime } from "./hooks/use-game-realtime";
import { usePageVisibility } from "./hooks/use-page-visibility";
import { LifeResultView } from "./life-result-view";
import { PlayingView } from "./playing-view";
import { ResultView } from "./result-view";
import { VoteResultView } from "./vote-result-view";
import { VotingView } from "./voting-view";

type GameSession = Awaited<ReturnType<typeof getGameSession>>;
type GameSessionRow = Database["public"]["Tables"]["game_sessions"]["Row"];

interface GameScreenProps {
  initialSession: GameSession;
  currentUserId: string;
  isOwner: boolean;
  totalCount: number;
}

// 백엔드와 동일한 라이프별 획득 팀 포인트 기준
const LIFE_POINTS: Record<number, number> = {
  5: 100,
  4: 80,
  3: 60,
  2: 40,
  1: 20,
  0: 0,
};

export function GameScreen({
  initialSession,
  currentUserId,
  isOwner,
  totalCount,
}: GameScreenProps) {
  const router = useRouter();
  const gameId = initialSession.id;

  const [session, setSession] = useState<GameSession>(initialSession);
  const [connectedCount, setConnectedCount] = useState(0);

  const [showLifeResult, setShowLifeResult] = useState(false);
  const [showVoteResult, setShowVoteResult] = useState(false);

  const [voteResultLosers, setVoteResultLosers] = useState<
    Array<{
      id: string;
      user_name: string;
      avatar_color: string;
      avatar_face: number;
      count: number;
    }>
  >([]);

  const [skipVoting, setSkipVoting] = useState(false);

  const startRequestedRef = useRef(false);
  const voteResultRequestedRef = useRef(false);
  const maxLifeRef = useRef(initialSession.team_life ?? 0);

  const onSessionUpdate = useCallback((updated: Partial<GameSessionRow>) => {
    setSession((prev) => {
      if (prev.status === "playing" && updated.status === "voting") {
        setShowLifeResult(true);
      }
      if (updated.status === "finished") {
        setShowVoteResult(false);
      }
      return { ...prev, ...updated };
    });
  }, []);

  const onConnectedCountChange = useCallback((count: number) => {
    setConnectedCount(count);
  }, []);

  useGameRealtime({
    gameId,
    userId: currentUserId,
    onSessionUpdate,
    onConnectedCountChange,
  });

  useEffect(() => {
    if (!isOwner) return;
    if (session.status !== "waiting") return;
    if (totalCount <= 0) return;
    if (connectedCount < totalCount) return;
    if (startRequestedRef.current) return;

    startRequestedRef.current = true;
    fetch(`/api/games/${gameId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    }).catch(() => {
      startRequestedRef.current = false;
    });
  }, [isOwner, session.status, totalCount, connectedCount, gameId]);

  usePageVisibility({
    gameId,
    isPlaying: session.status === "playing",
  });

  const handleCancel = () => {
    router.push(`/team/${session.team_id}`);
  };

  if (session.status === "waiting") {
    return (
      <ConnectingView
        connectedCount={connectedCount}
        totalCount={totalCount}
        onCancel={handleCancel}
      />
    );
  }

  if (session.status === "playing") {
    return <PlayingView session={session} isOwner={isOwner} />;
  }

  if (showLifeResult) {
    return (
      <LifeResultView
        maxLife={maxLifeRef.current}
        currentLife={session.team_life ?? 0}
        onComplete={(isPerfect) => {
          setShowLifeResult(false);
          if (isPerfect) {
            setSkipVoting(true);
            if (!isOwner) return;

            fetch(`/api/games/${gameId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "finish" }),
            }).catch(console.error);
          }
        }}
      />
    );
  }

  if (showVoteResult) {
    return (
      <VoteResultView
        losers={voteResultLosers}
        onComplete={() => {
          if (!isOwner) return;
          fetch(`/api/games/${gameId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "finish" }),
          }).catch(console.error);
        }}
      />
    );
  }

  if (session.status === "voting" && skipVoting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="font-medium text-zinc-500">결과를 불러오는 중...</p>
      </div>
    );
  }

  if (session.status === "voting" && !skipVoting) {
    return (
      <VotingView
        session={session}
        currentUserId={currentUserId}
        isOwner={isOwner}
        onVoteEnd={async () => {
          if (voteResultRequestedRef.current) return;
          voteResultRequestedRef.current = true;
          const res = await fetch(`/api/games/${gameId}/votes`);
          const { results } = await res.json();
          const maxCount: number = results[0]?.count ?? 0;
          const losers =
            maxCount > 0 ? results.filter((r: { count: number }) => r.count === maxCount) : [];
          setVoteResultLosers(losers);
          setShowVoteResult(true);
        }}
      />
    );
  }

  const participants =
    session.game_participants?.map((p) => ({
      id: p.profiles?.id ?? p.user_id ?? "",
      user_name: p.profiles?.user_name ?? "알 수 없음",
      avatar_color: p.profiles?.avatar_color ?? "#6366f1",
      avatar_face: p.profiles?.avatar_face ?? 1,
    })) ?? [];

  // 결과 화면을 위한 포인트 도출 (상태 동기화 기반)
  const teamEarnedPoints = LIFE_POINTS[Math.max(0, Math.min(5, session.team_life ?? 0))] ?? 0;

  // 내가 최다 득표자(방출자)에 포함되는지 확인하여 개인 포인트 결정
  const hasLostLife = (session.team_life ?? 0) < maxLifeRef.current;
  const isLoser = voteResultLosers.some((loser) => loser.id === currentUserId);

  // 퍼펙트 게임 시 10점, 방출 시 2점, 일반 참여 시 5점
  const personalEarnedPoints = hasLostLife ? (isLoser ? 2 : 5) : 10;

  return (
    <ResultView
      gameId={gameId}
      teamId={session.team_id ?? ""}
      teamLife={session.team_life ?? 0}
      maxLife={maxLifeRef.current}
      participants={participants}
      teamEarnedPoints={teamEarnedPoints}
      personalEarnedPoints={personalEarnedPoints}
    />
  );
}
