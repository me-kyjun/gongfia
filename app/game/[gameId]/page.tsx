import { notFound } from "next/navigation";
import { Suspense } from "react";

import { GameScreen } from "@/components/game/game-screen";
import { getGameSession } from "@/lib/supabase/game";
import { createClient } from "@/lib/supabase/server";

interface GamePageProps {
  params: Promise<{ gameId: string }>;
}

async function GameLoader({ gameId }: { gameId: string }) {
  let session;
  try {
    session = await getGameSession(gameId);
  } catch {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user!.id;

  // 팀 방장 여부 확인
  const { data: team } = await supabase
    .from("teams")
    .select("owner_id")
    .eq("id", session.team_id as string)
    .single();

  const isOwner = team?.owner_id === currentUserId;

  // 게임에 참여하기로 한 전체 인원 수 (game_participants 명단 = 분모 M).
  // GameSetupModal에서 POST /api/games/[gameId]/participants로 사전 등록됨.
  // 실제 접속자 수(분자 N)는 GameScreen이 Presence로 집계한다.
  const totalCount = session.game_participants?.length ?? 0;

  return (
    <GameScreen
      initialSession={session}
      currentUserId={currentUserId}
      isOwner={isOwner}
      totalCount={totalCount}
    />
  );
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <p className="font-medium text-zinc-500">게임 정보를 불러오는 중...</p>
        </div>
      }
    >
      <GameLoader gameId={gameId} />
    </Suspense>
  );
}
