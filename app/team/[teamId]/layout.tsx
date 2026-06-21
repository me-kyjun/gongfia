import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";

interface TeamLayoutProps {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}

/**
 * 권한 검증을 수행하는 내부 비동기 컴포넌트.
 * params Promise와 children을 받아 Suspense 경계 안에서 비캐시 데이터에 접근한다.
 */
async function TeamAccessGuard({
  paramsPromise,
  children,
}: {
  paramsPromise: Promise<{ teamId: string }>;
  children: React.ReactNode;
}) {
  const { teamId } = await paramsPromise;
  const supabase = await createClient();

  // 1. 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // 2. 팀 방장 여부 확인 (방장은 멤버 검증 없이 통과)
  const { data: team } = await supabase
    .from("teams")
    .select("owner_id")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) {
    redirect("/home");
  }

  const isOwner = team.owner_id === user.id;

  if (!isOwner) {
    // 방장이 아닌 경우 team_members 테이블에서 멤버 여부 확인
    const { data: membership } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      redirect("/home");
    }
  }

  return <>{children}</>;
}

/**
 * 팀 라우트 공용 레이아웃 (서버 컴포넌트).
 * params Promise를 직접 Suspense 내부 컴포넌트에 전달하여 모든 비캐시 데이터 접근을
 * Suspense 경계 안으로 이동시킨다. cacheComponents 환경과 호환된다.
 */
export default function TeamLayout({ children, params }: TeamLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <p className="font-medium text-zinc-500">권한을 확인하는 중...</p>
        </div>
      }
    >
      <TeamAccessGuard paramsPromise={params}>{children}</TeamAccessGuard>
    </Suspense>
  );
}
