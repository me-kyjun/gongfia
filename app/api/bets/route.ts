import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "베팅 기능은 MVP 범위에서 제외되었습니다." }, { status: 410 });
}
