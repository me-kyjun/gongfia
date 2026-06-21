import { NextRequest, NextResponse } from "next/server";

import { createTeam, listMyTeams } from "@/lib/supabase/game";

/** GET /api/teams — 내 팀 목록 */
export async function GET() {
  try {
    const teams = await listMyTeams();
    return NextResponse.json({ teams });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 401 });
  }
}

/** POST /api/teams — 팀 생성 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const team = await createTeam({
      name: body.name,
      max_members: Number(body.max_members) || 6,
    });
    return NextResponse.json({ team });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
