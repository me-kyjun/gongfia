import { NextRequest, NextResponse } from "next/server";

import { createGameSession } from "@/lib/supabase/game";

/** POST /api/games — 게임 세션 생성 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await createGameSession({
      team_id: body.team_id,
      duration_minutes: Number(body.duration_minutes) || 60,
      team_life: Number(body.team_life) || 5,
      rest_interval: Number(body.rest_interval) || 50,
    });
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
