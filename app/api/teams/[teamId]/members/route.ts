import { NextRequest, NextResponse } from "next/server";

import { getTeamMembers } from "@/lib/supabase/game";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;
    const members = await getTeamMembers(teamId);
    return NextResponse.json({ members });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

// 방 및 자진 탈퇴를 처리하는 DELETE 메서드
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;
    const { targetUserId } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: team } = await supabase
      .from("teams")
      .select("owner_id")
      .eq("id", teamId)
      .single();

    if (!team) {
      return NextResponse.json({ error: "팀을 찾을 수 없습니다." }, { status: 404 });
    }

    const isOwner = team.owner_id === user.id;
    const isSelf = user.id === targetUserId; // 본인의 탈퇴 요청인지 확인

    // 권한 검증: 방장이거나 본인의 자진 탈퇴 요청이어야 함
    if (!isOwner && !isSelf) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (isOwner && isSelf) {
      return NextResponse.json({ error: "방장은 일반 탈퇴를 할 수 없습니다." }, { status: 400 });
    }

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", targetUserId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
