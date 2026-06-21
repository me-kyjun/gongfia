import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TeamLobby } from "@/components/team/team-lobby";
import { getTeamById } from "@/lib/supabase/game";
import { createClient } from "@/lib/supabase/server";

interface TeamPageProps {
  params: Promise<{ teamId: string }>;
}

/**
 * 팀 데이터를 서버에서 조회해 TeamLobby에 전달하는 내부 비동기 컴포넌트.
 * Suspense 경계 안에서 실행되어 cacheComponents와 호환된다.
 */
async function TeamLobbyLoader({ teamId }: { teamId: string }) {
  // 팀 데이터 조회 (멤버 + 프로필 포함)
  let team;
  try {
    team = await getTeamById(teamId);
  } catch {
    notFound();
  }

  // 현재 유저 ID 조회
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // layout.tsx에서 인증을 이미 검증했으므로 user는 항상 존재
  const currentUserId = user!.id;
  const isOwner = team.owner_id === currentUserId;

  return <TeamLobby initialTeam={team} currentUserId={currentUserId} isOwner={isOwner} />;
}

/**
 * 팀 로비 페이지 (서버 컴포넌트).
 * Suspense로 TeamLobbyLoader를 감싸 cacheComponents 환경에서 안전하게 동적 렌더링한다.
 */
export default async function TeamPage({ params }: TeamPageProps) {
  const { teamId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <p className="font-medium text-zinc-500">팀 정보를 불러오는 중...</p>
        </div>
      }
    >
      <TeamLobbyLoader teamId={teamId} />
    </Suspense>
  );
}
