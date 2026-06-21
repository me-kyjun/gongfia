// 이 파일은 하위 호환을 위해 유지합니다. 새 API는 /api/teams를 사용하세요.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "이 API는 더 이상 사용되지 않습니다. /api/teams를 사용하세요." },
    { status: 410 },
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "이 API는 더 이상 사용되지 않습니다. /api/teams를 사용하세요." },
    { status: 410 },
  );
}
