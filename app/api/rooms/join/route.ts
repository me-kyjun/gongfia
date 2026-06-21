import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "이 API는 더 이상 사용되지 않습니다. /api/teams/[teamId]를 사용하세요." },
    { status: 410 },
  );
}
