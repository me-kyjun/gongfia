import { NextRequest, NextResponse } from "next/server";

import { castVote, getVoteResults } from "@/lib/supabase/game";

/** POST /api/games/[gameId]/votes — 범인 지목 투표 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  try {
    const { gameId } = await params;
    const { target_id } = await request.json();
    const vote = await castVote({ game_id: gameId, target_id });
    return NextResponse.json({ vote });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

/** GET /api/games/[gameId]/votes — 투표 결과 조회 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  try {
    const { gameId } = await params;
    const results = await getVoteResults(gameId);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
