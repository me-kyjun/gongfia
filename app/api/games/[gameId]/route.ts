import { NextRequest, NextResponse } from "next/server";

import { finishGame, getGameSession, startGame, transitionToVoting } from "@/lib/supabase/game";

/** GET /api/games/[gameId] — 게임 세션 조회 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  try {
    const { gameId } = await params;
    const session = await getGameSession(gameId);
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 404 });
  }
}

/**
 * PATCH /api/games/[gameId] — 게임 상태 전환
 * body: { action: "start" | "vote" | "finish" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  try {
    const { gameId } = await params;
    const { action } = await request.json();

    let result;
    if (action === "start") {
      result = await startGame(gameId);
    } else if (action === "vote") {
      result = await transitionToVoting(gameId);
    } else if (action === "finish") {
      result = await finishGame(gameId);
    } else {
      return NextResponse.json({ error: "유효하지 않은 action입니다." }, { status: 400 });
    }

    return NextResponse.json({ session: result });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
