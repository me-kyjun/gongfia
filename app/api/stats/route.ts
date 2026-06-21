import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/** GET /api/stats — 내 통계 요약 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [{ data: profile }, { count: teamCount }, { count: gameCount }] = await Promise.all([
      supabase
        .from("profiles")
        .select("personal_points, user_name, avatar_color")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("game_participants")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    return NextResponse.json({
      summary: {
        user_name: profile?.user_name ?? "",
        avatar_color: profile?.avatar_color ?? "#6366f1",
        personal_points: profile?.personal_points ?? 0,
        team_count: teamCount ?? 0,
        game_count: gameCount ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
