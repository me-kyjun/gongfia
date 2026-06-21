// tu/components/game/voting-view.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { getGameSession, getVoteResults } from "@/lib/supabase/game";
// ✅ 전역 유틸리티 함수 임포트
import { getSlimeImage } from "@/lib/utils";

import { ChatBox } from "./chat-box";

type GameSession = Awaited<ReturnType<typeof getGameSession>>;
type VoteResult = Awaited<ReturnType<typeof getVoteResults>>[number];

interface VotingViewProps {
  session: GameSession;
  currentUserId: string;
  isOwner: boolean;
  onVoteEnd: () => void;
}

interface ParticipantCardProps {
  userId: string;
  userName: string;
  avatarColor: string;
  avatarFace: number;
  isSelected: boolean;
  hasVoted: boolean;
  onVote: (targetId: string) => void;
}

function ParticipantCard({
  userId,
  userName,
  avatarColor,
  avatarFace,
  isSelected,
  hasVoted,
  onVote,
}: ParticipantCardProps) {
  const slimeSrc = getSlimeImage(avatarColor, avatarFace);

  return (
    <div className="flex w-40 flex-col items-start rounded-2xl bg-white p-4 shadow">
      <span className="mb-3 text-sm font-semibold text-zinc-800">{userName}</span>

      <div className="mb-4 flex w-full justify-center">
        <div className="relative flex h-20 w-20 items-center justify-center font-bold text-white drop-shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slimeSrc}
            alt="Slime Avatar"
            className="absolute inset-0 h-full w-full object-contain [image-rendering:pixelated]"
            draggable={false}
          />
        </div>
      </div>

      <button
        onClick={() => onVote(userId)}
        disabled={hasVoted}
        className={`w-full rounded-lg py-2 text-sm font-medium transition-all ${
          isSelected
            ? "bg-zinc-900 text-white"
            : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        투표하기
      </button>
    </div>
  );
}

export function VotingView({ session, currentUserId, onVoteEnd }: VotingViewProps) {
  const gameId = session.id;
  const participants = session.game_participants ?? [];

  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [myVoteTargetId, setMyVoteTargetId] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  const voteChannelRef = useRef<ReturnType<typeof createClient>["channel"] | null>(null);

  const onVoteEndRef = useRef(onVoteEnd);
  onVoteEndRef.current = onVoteEnd;

  const voteEndCalledRef = useRef(false);

  const refreshVotes = useCallback(async () => {
    const res = await fetch(`/api/games/${gameId}/votes`);
    const { results }: { results: VoteResult[] } = await res.json();

    const counts: Record<string, number> = {};
    results.forEach((r) => {
      counts[r.id] = r.count;
    });
    setVoteCounts(counts);
  }, [gameId]);

  useEffect(() => {
    refreshVotes();
  }, [refreshVotes]);

  useEffect(() => {
    if (participants.length === 0) return;

    const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

    if (totalVotes >= participants.length) {
      if (voteEndCalledRef.current) return;
      voteEndCalledRef.current = true;
      onVoteEndRef.current();
    }
  }, [voteCounts, participants.length]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const setup = async () => {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      if (authSession?.access_token) {
        await supabase.realtime.setAuth(authSession.access_token);
      }
      if (cancelled) return;

      const channel = supabase
        .channel(`game-votes:${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "votes",
            filter: `game_id=eq.${gameId}`,
          },
          () => {
            refreshVotes();
          },
        )
        .subscribe();

      voteChannelRef.current = channel as unknown as ReturnType<typeof createClient>["channel"];

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setup();

    return () => {
      cancelled = true;
      cleanup.then((fn) => fn?.());
    };
  }, [gameId, refreshVotes]);

  const handleVote = async (targetId: string) => {
    if (voting || myVoteTargetId) return;
    setVoting(true);

    try {
      const res = await fetch(`/api/games/${gameId}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_id: targetId }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        console.error("투표 실패:", error);
        return;
      }

      setMyVoteTargetId(targetId);
      await refreshVotes();
    } finally {
      setVoting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-zinc-100 px-6 py-12">
      <h1 className="text-3xl font-bold text-zinc-900">가장 집중하지 않은 사람을 투표하세요!</h1>

      <div className="flex flex-wrap justify-center gap-4">
        {participants.map((p) => {
          const profile = p.profiles;
          if (!profile) return null;

          return (
            <ParticipantCard
              key={p.user_id}
              userId={p.user_id}
              userName={profile.user_name ?? "?"}
              avatarColor={profile.avatar_color ?? "#6366f1"}
              avatarFace={profile.avatar_face ?? 1}
              isSelected={myVoteTargetId === p.user_id}
              hasVoted={!!myVoteTargetId}
              onVote={handleVote}
            />
          );
        })}
      </div>

      <ChatBox gameId={gameId} currentUserId={currentUserId} />
    </main>
  );
}
