import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/games/[gameId]/participants
 * 방장이 선택한 멤버들을 game_participants에 사전 등록한다.
 * body: { user_ids: string[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  try {
    const { gameId } = await params;
    const { user_ids } = await request.json();

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({ error: "user_ids가 필요합니다." }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 게임 세션에서 team_id 조회
    const { data: gameSession } = await supabase
      .from("game_sessions")
      .select("team_id")
      .eq("id", gameId)
      .maybeSingle();

    if (!gameSession) {
      return NextResponse.json({ error: "게임 세션을 찾을 수 없습니다." }, { status: 404 });
    }

    // 3. 방장 여부 확인
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", gameSession.team_id as string)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership?.role !== "owner") {
      return NextResponse.json({ error: "방장만 참여자를 등록할 수 있습니다." }, { status: 403 });
    }

    // 4. user_ids가 모두 해당 팀 멤버인지 확인
    const { data: validMembers } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", gameSession.team_id as string)
      .in("user_id", user_ids as string[]);

    const validIds = new Set((validMembers ?? []).map((m) => m.user_id));
    const invalidIds = (user_ids as string[]).filter((id) => !validIds.has(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: "팀 멤버가 아닌 유저가 포함되어 있습니다." },
        { status: 400 },
      );
    }

    // 5. 현재 이미 등록된 참여자 제외하고 INSERT
    const { data: existing } = await supabase
      .from("game_participants")
      .select("user_id")
      .eq("game_id", gameId);

    const existingIds = new Set((existing ?? []).map((p) => p.user_id));
    const newIds = (user_ids as string[]).filter((id) => !existingIds.has(id));

    if (newIds.length > 0) {
      const { error } = await supabase
        .from("game_participants")
        .insert(newIds.map((user_id) => ({ game_id: gameId, user_id })));
      if (error) throw error;
    }

    return NextResponse.json({ registered: newIds.length });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

/** GET /api/games/[gameId]/participants — 참여자 목록 조회 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  try {
    const { gameId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("game_participants")
      .select("user_id, profiles(id, user_name, avatar_color)")
      .eq("game_id", gameId);

    if (error) throw error;
    return NextResponse.json({ participants: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
