import { NextRequest, NextResponse } from "next/server";

import { getTeamById, joinTeam } from "@/lib/supabase/game";

/** GET /api/teams/[teamId] — 팀 상세 조회 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;
    const team = await getTeamById(teamId);
    return NextResponse.json({ team });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 404 });
  }
}

/** POST /api/teams/[teamId] — 팀 참가 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;
    const member = await joinTeam(teamId);
    return NextResponse.json({ member });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
