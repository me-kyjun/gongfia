import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { user_name, avatar_color } = body;
    if (typeof user_name !== "string" || typeof avatar_color !== "string") {
      return NextResponse.json(
        { error: "user_name과 avatar_color를 모두 전달해야 합니다." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profileClient = createServiceClient();

    const { error } = await profileClient.from("profiles").upsert(
      {
        id: user.id,
        user_name,
        avatar_color,
      },
      { onConflict: "id" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
