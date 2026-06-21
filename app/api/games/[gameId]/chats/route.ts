import { NextRequest, NextResponse } from "next/server";

import { getChatMessages, sendChatMessage } from "@/lib/supabase/game";
import { createClient } from "@/lib/supabase/server";

/** GET /api/games/[gameId]/chats — 채팅 메시지 목록 조회 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { gameId } = await params;
    const messages = await getChatMessages(gameId);
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

/** POST /api/games/[gameId]/chats — 채팅 메시지 전송 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { gameId } = await params;
    const body = await request.json();
    const message: string = body?.message ?? "";

    if (!message.trim()) {
      return NextResponse.json({ error: "메시지를 입력해주세요." }, { status: 400 });
    }

    const chat = await sendChatMessage({ game_id: gameId, message });
    return NextResponse.json({ chat });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
