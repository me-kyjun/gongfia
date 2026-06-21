import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const { teamId } = await params;
    const body = await request.json();
    const { action, shopItemId, placedX, roomId } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 클라이언트의 RLS(Row Level Security) 제약을 우회하기 위한 관리자 클라이언트
    const adminSupabase = createAdminClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    if (action === "store") {
      if (!roomId) throw new Error("가구 ID가 필요합니다.");

      const { error } = await adminSupabase
        .from("team_rooms")
        .update({ placed_at: null })
        .eq("id", roomId)
        .eq("team_id", teamId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    } else {
      if (!shopItemId || placedX === undefined) throw new Error("파라미터가 부족합니다.");

      const { data: unplacedRows } = await adminSupabase
        .from("team_rooms")
        .select("id")
        .eq("team_id", teamId)
        .eq("item_id", shopItemId)
        .is("placed_at", null)
        .limit(1);

      if (!unplacedRows || unplacedRows.length === 0) {
        return NextResponse.json(
          { error: "배치할 수 있는 해당 가구가 없습니다." },
          { status: 404 },
        );
      }

      const { error } = await adminSupabase
        .from("team_rooms")
        .update({ placed_at: placedX })
        .eq("id", unplacedRows[0].id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }
  } catch (error: unknown) {
    // ✅ any 대신 unknown 사용 후 타입 가드 적용
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
