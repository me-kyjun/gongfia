// tu/app/api/games/[gameId]/logs/route.ts
import { NextRequest, NextResponse } from "next/server";

import { deductLife, getGameLogStats } from "@/lib/supabase/game";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/games/[gameId]/logs — 이탈/복귀 이벤트 기록
 * body: { event_type: "leave" | "return" }
 * leave 이벤트는 라이프 즉시 차감
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  try {
    const { gameId } = await params;

    // sendBeacon 등 백그라운드 전송 시 빈 body로 인한 파싱 에러를 방지하기 위해 text로 먼저 읽습니다.
    const bodyText = await request.text();
    if (!bodyText) {
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }

    const { event_type } = JSON.parse(bodyText);

    if (event_type !== "leave" && event_type !== "return") {
      return NextResponse.json(
        { error: "event_type은 leave 또는 return이어야 합니다." },
        { status: 400 },
      );
    }

    // lib/supabase/server.ts의 createClient()로 쿠키 기반 세션 사용
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 이탈/복귀 로그 직접 INSERT (auth.uid() 기반 RLS 적용)
    const { data: log, error: logError } = await supabase
      .from("game_logs")
      .insert({ game_id: gameId, user_id: user.id, event_type })
      .select()
      .single();

    if (logError) throw logError;

    // leave 이벤트 시 라이프 차감 (game.ts 함수 재사용)
    let session = null;
    if (event_type === "leave") {
      try {
        session = await deductLife(gameId);
      } catch (deductError) {
        // deductLife 에러가 전체 API 응답을 400으로 터뜨리지 않도록 여기서 처리.
        // "supabaseKey is required" 에러는 SUPABASE_SERVICE_ROLE_KEY 미설정을 의미함.
        console.error("[Deduct Life Error]:", (deductError as Error).message);
      }
    }

    return NextResponse.json({ log, session });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

/** GET /api/games/[gameId]/logs — 게임 종료 후 이탈 통계 조회 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  try {
    const { gameId } = await params;
    const stats = await getGameLogStats(gameId);
    return NextResponse.json({ stats });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
