import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;
    const { itemId, price } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 결제 처리를 위해 RLS를 우회하는 어드민 클라이언트 생성
    const adminSupabase = createAdminClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // 1. 현재 팀 포인트 조회
    const { data: team, error: teamError } = await adminSupabase
      .from("teams")
      .select("room_points")
      .eq("id", teamId)
      .single();

    if (teamError || !team) throw new Error("팀 정보를 찾을 수 없습니다.");
    if (team.room_points < price) throw new Error("포인트가 부족합니다.");

    const newPoints = team.room_points - price;

    // 2. 포인트 차감
    const { error: updateError } = await adminSupabase
      .from("teams")
      .update({ room_points: newPoints })
      .eq("id", teamId);

    if (updateError) throw new Error("포인트 결제 중 오류가 발생했습니다.");

    // 3. 아이템을 team_rooms에 지급 (배치되지 않았으므로 placed_at은 null)
    const { error: insertError } = await adminSupabase.from("team_rooms").insert({
      team_id: teamId,
      item_id: itemId,
      purchased_by: user.id,
      placed_at: null, // 명시적으로 null 지정
    });

    if (insertError) {
      // 지급 실패 시 롤백 (포인트 복구)
      await adminSupabase.from("teams").update({ room_points: team.room_points }).eq("id", teamId);
      throw new Error("아이템 지급 중 오류가 발생하여 결제가 취소되었습니다.");
    }

    return NextResponse.json({ success: true, remaining_points: newPoints });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
