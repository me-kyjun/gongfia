import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";

interface GameLayoutProps {
  children: React.ReactNode;
  params: Promise<{ gameId: string }>;
}

async function GameAccessGuard({
  paramsPromise,
  children,
}: {
  paramsPromise: Promise<{ gameId: string }>;
  children: React.ReactNode;
}) {
  const { gameId } = await paramsPromise;
  const supabase = await createClient();

  // 1.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // 2.
  const { data: session } = await supabase
    .from("game_sessions")
    .select("id, team_id")
    .eq("id", gameId)
    .maybeSingle();

  if (!session) {
    redirect("/home");
  }

  // 3. [수정됨] 팀 멤버가 아닌 '게임 참여자(game_participants)'인지 정확히 확인합니다.
  const { data: participant } = await supabase
    .from("game_participants")
    .select("user_id")
    .eq("game_id", gameId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant) {
    // 게임 참여자가 아니면 팀 로비로 돌려보냄
    redirect(`/team/${session.team_id}`);
  }

  return <>{children}</>;
}

export default function GameLayout({ children, params }: GameLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <p className="font-medium text-zinc-500"> ...</p>
        </div>
      }
    >
      <GameAccessGuard paramsPromise={params}>{children}</GameAccessGuard>
    </Suspense>
  );
}
