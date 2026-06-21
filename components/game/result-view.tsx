"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSlimeImage } from "@/lib/utils";

import { PixelHeart } from "./pixel-heart";

interface Participant {
  id: string;
  user_name: string;
  avatar_color: string;
  avatar_face?: number;
}

interface ResultViewProps {
  gameId: string;
  teamId: string;
  teamLife: number;
  maxLife: number;
  participants: Participant[];
  teamEarnedPoints: number;
  personalEarnedPoints: number;
}

interface LeaveStats {
  [userId: string]: { leave_count: number; total_away_ms: number };
}

function SlimeAvatar({ color, face = 1 }: { color: string; face?: number }) {
  return (
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getSlimeImage(color, face)}
        alt="avatar"
        className="h-full w-full object-contain [image-rendering:pixelated]"
      />
    </div>
  );
}

export function ResultView({
  gameId,
  teamId,
  teamLife,
  maxLife,
  participants,
  teamEarnedPoints,
  personalEarnedPoints,
}: ResultViewProps) {
  const router = useRouter();
  const [stats, setStats] = useState<LeaveStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/games/${gameId}/logs`)
      .then((r) => r.json())
      .then(({ stats: s }) => setStats(s ?? {}))
      .catch(() => setStats({}))
      .finally(() => setLoading(false));
  }, [gameId]);

  // 이탈 횟수가 많은 순으로 정렬
  const sortedParticipants = [...participants].sort((a, b) => {
    const aCount = stats[a.id]?.leave_count ?? 0;
    const bCount = stats[b.id]?.leave_count ?? 0;
    return bCount - aCount;
  });

  // 가장 많이 이탈한 횟수 도출 (0회인 경우는 제외)
  const maxLeaveCount =
    sortedParticipants.length > 0 ? (stats[sortedParticipants[0].id]?.leave_count ?? 0) : 0;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4">
      {/* 하단 여백을 기존 mb-6(24px)에서 1.75배인 42px로 수정 */}
      <h1 className="mb-[40px] text-3xl font-extrabold tracking-tight text-zinc-900">게임 결과</h1>

      {/* 남은 라이프 */}
      <div className="mb-8 flex items-center gap-4">
        {Array.from({ length: maxLife }).map((_, i) => (
          <PixelHeart key={i} filled={i < teamLife} size={8} />
        ))}
      </div>

      {/* 멤버별 이탈 횟수 */}
      <div className="w-full max-w-sm space-y-2">
        {loading ? (
          <p className="text-center text-sm text-zinc-400">불러오는 중...</p>
        ) : (
          sortedParticipants.map((p) => {
            const leaveCount = stats[p.id]?.leave_count ?? 0;

            // 이탈 횟수가 1회 이상이면서 가장 많이 이탈한 사람이면 텍스트를 빨간색으로 지정
            const isMostDistracted = leaveCount > 0 && leaveCount === maxLeaveCount;

            return (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <SlimeAvatar color={p.avatar_color} face={p.avatar_face} />
                  <span className="font-medium text-zinc-700">{p.user_name}</span>
                </div>

                {/* 가장 딴짓 많이 한 사람 빨간색 스타일링 반영 */}
                <span
                  className={`text-lg font-semibold ${isMostDistracted ? "text-red-500" : "text-zinc-800"}`}
                >
                  {leaveCount}회
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* 획득 포인트 카드형 UI 출력 */}
      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-500">팀 포인트 획득</span>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-amber-500">+{teamEarnedPoints}</span>
            <span className="text-sm font-semibold text-zinc-400">P</span>
          </div>
        </div>
        <div className="h-px w-full bg-zinc-100" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-500">내 개인 포인트 획득</span>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-emerald-500">+{personalEarnedPoints}</span>
            <span className="text-sm font-semibold text-zinc-400">P</span>
          </div>
        </div>
      </div>

      {/* 방으로 버튼 */}
      <button
        onClick={() => router.push(`/team/${teamId}`)}
        className="mt-10 w-full max-w-sm rounded-xl bg-zinc-900 py-4 text-base font-semibold text-white transition-opacity hover:opacity-80"
      >
        방으로
      </button>
    </main>
  );
}
