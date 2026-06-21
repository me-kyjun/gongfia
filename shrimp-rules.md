# GongFia 프로젝트 개발 규칙 (AI Agent용)

## 1. 프로젝트 개요

- **목적**: 팀 기반 게임화 학습 플랫폼 (팀 구성, 게임 세션, 투표, 포인트 시스템)
- **스택**: Next.js 16 App Router + React 19 + TypeScript + Supabase + Tailwind CSS + shadcn/ui
- **인증**: Supabase Auth (쿠키 기반 세션, SSR 지원)

---

## 2. 프로젝트 아키텍처

### 디렉토리 구조

```
app/
  auth/              # 인증 페이지 (공개)
  home/              # 인증 필요 홈
  room/[roomid]/     # 게임 룸 (인증 필요)
  api/               # Route Handlers
    games/           # 게임 CRUD + 로그/투표
    rooms/           # 룸 CRUD + 멤버
    teams/           # 팀 CRUD + 멤버
    bets/            # 베팅
    votes/           # 투표
    sessions/        # 세션
    stats/           # 통계
    avatar/          # 아바타
components/
  ui/                # shadcn/ui 컴포넌트 (직접 수정 가능)
  *.tsx              # 도메인 컴포넌트
lib/
  supabase/
    server.ts        # 서버 컴포넌트용 클라이언트
    client.ts        # 클라이언트 컴포넌트용 클라이언트
    proxy.ts         # 세션 갱신 (proxy.ts에서 호출)
    game.ts          # 게임 로직 유틸리티
  utils.ts           # cn() 함수
types/
  database.ts        # Supabase DB 타입 (자동 생성)
proxy.ts             # Next.js 16 미들웨어 (구 middleware.ts)
```

### DB 테이블 목록

| 테이블 | 설명 |
|--------|------|
| `profiles` | 사용자 프로필 (username, avatar_color, personal_points) |
| `teams` | 팀 정보 (name, owner_id, room_points, max_members) |
| `team_members` | 팀 멤버 (role: owner/member) |
| `game_sessions` | 게임 세션 (status, duration, team_life) |
| `game_participants` | 게임 참여자 |
| `game_logs` | 게임 이벤트 로그 (event_type: leave/return) |
| `votes` | 투표 기록 (voter_id, target_id, game_id) |
| `team_rooms` | 팀 룸 아이템 (item_id, purchased_by) |
| `shop_items` | 상점 아이템 (buff_effect, price) |

---

## 3. Supabase 클라이언트 사용 규칙

### 반드시 준수

- **서버 컴포넌트 / Route Handler**: `lib/supabase/server.ts`의 `createClient()` 사용
  ```ts
  import { createClient } from "@/lib/supabase/server";
  const supabase = await createClient();
  ```
- **클라이언트 컴포넌트** (`"use client"`): `lib/supabase/client.ts`의 `createClient()` 사용
  ```ts
  import { createClient } from "@/lib/supabase/client";
  const supabase = createClient();
  ```
- **Proxy 미들웨어**: `lib/supabase/proxy.ts`의 `updateSession()` 만 사용

### 금지

- 전역 변수에 Supabase 클라이언트 인스턴스 저장 금지
- 클라이언트 컴포넌트에서 `lib/supabase/server.ts` import 금지
- 서버 컴포넌트에서 `lib/supabase/client.ts` import 금지

---

## 4. 인증 흐름

### 규칙

- `proxy.ts` (프로젝트 루트)가 모든 요청을 가로채 `lib/supabase/proxy.ts`의 `updateSession()` 호출
- 세션 검증: `supabase.auth.getClaims()` — JWT 클레임 읽기 (빠름, proxy에서 사용)
- 신뢰된 사용자 정보: `supabase.auth.getUser()` — auth 서버 검증 (느림, 보안 필요 시 사용)
- 인증이 필요한 경로에서는 반드시 `getUser()`로 검증 후 사용

### 보호 경로

- `/home/**` — 인증 필요
- `/room/**` — 인증 필요
- `/auth/**` — 공개 (로그인/회원가입)
- `/` — 공개

### 새 보호 경로 추가 시

- `proxy.ts`의 matcher 또는 조건 확인 후 업데이트 필요

---

## 5. 스타일링 규칙

### 반드시 준수

- Tailwind 유틸리티 클래스만 사용
- 클래스 조합 시 반드시 `cn()` 함수 사용 (`lib/utils.ts`)
  ```ts
  import { cn } from "@/lib/utils";
  className={cn("base-class", condition && "conditional-class")}
  ```
- 색상은 CSS 변수 기반 시맨틱 클래스 사용: `bg-background`, `text-foreground`, `text-muted-foreground` 등
- 반응형: 모바일 우선 (`sm:`, `md:`, `lg:` 순서)

### 금지

- 인라인 스타일 (`style={{}}`) 사용 금지
- 하드코딩 색상 (`text-[#123456]`, `bg-red-500` 직접 지정) 금지
- `clsx` 직접 사용 금지 — `cn()`으로 대체

---

## 6. TypeScript 타입 규칙

### 반드시 준수

- DB 관련 타입은 `types/database.ts`에서 import
  ```ts
  import type { Database } from "@/types/database";
  type Profile = Database["public"]["Tables"]["profiles"]["Row"];
  ```
- `any` 타입 사용 금지 — `unknown` 또는 명시적 타입 사용
- API 응답 타입은 명시적으로 정의

### DB 스키마 변경 시

- Supabase CLI로 타입 재생성: `supabase gen types typescript --local > types/database.ts`
- 또는 MCP `generate_typescript_types` 도구 사용
- `types/database.ts` 반드시 업데이트 후 관련 코드 수정

---

## 7. API Route Handler 규칙

### 구조 패턴

```ts
// app/api/[resource]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ...
}
```

### 규칙

- 모든 인증 필요 API에서 `getUser()`로 사용자 검증
- 에러 응답은 `NextResponse.json({ error: "..." }, { status: N })` 형식
- `console.log` 사용 금지 — 서버 로그는 적절한 에러 핸들링으로 대체

---

## 8. 컴포넌트 규칙

### 파일 위치

- 재사용 가능한 UI: `components/ui/` (shadcn/ui 기반)
- 도메인 컴포넌트: `components/` 루트
- 페이지별 전용 컴포넌트: 해당 `app/` 경로 근처 또는 `components/`

### 클라이언트 컴포넌트

- 상호작용, 상태, 훅 사용 시 파일 최상단에 `"use client"` 선언
- 서버 컴포넌트를 클라이언트 컴포넌트로 wrapping 시 최소화

### shadcn/ui 컴포넌트 추가

```bash
npx shadcn@latest add <component-name>
```

---

## 9. 파일 동시 수정 필요 케이스

| 작업 | 함께 수정할 파일 |
|------|-----------------|
| DB 스키마 변경 | `types/database.ts` 재생성 후 관련 코드 수정 |
| 인증 로직 변경 | `proxy.ts` + `lib/supabase/proxy.ts` 동시 수정 |
| 새 보호 경로 추가 | `proxy.ts` matcher/조건 업데이트 |
| 새 shadcn/ui 컴포넌트 | `components/ui/` 하위에 추가, `cn()` 사용 |
| 게임 로직 변경 | `lib/supabase/game.ts` + 관련 API 라우트 확인 |

---

## 10. 금지 사항

- `console.log` 사용 금지 (디버깅 후 반드시 제거)
- 인라인 스타일 금지
- 전역 Supabase 클라이언트 인스턴스 저장 금지
- `any` 타입 사용 금지
- `types/database.ts` 직접 수동 편집 금지 (자동 생성 파일)
- 서버/클라이언트 Supabase 클라이언트 혼용 금지
- 색상 하드코딩 금지

---

## 11. AI 결정 기준

### Supabase 클라이언트 선택

```
파일에 "use client" 있음? → client.ts
파일이 서버 컴포넌트 / Route Handler? → server.ts
proxy.ts 관련 코드? → proxy.ts의 updateSession()
```

### 인증 검증 방법 선택

```
보안이 중요한 서버 작업 (결제, 권한 변경)? → getUser()
미들웨어 세션 갱신? → getClaims()
```

### 새 기능 추가 위치

```
DB 접근 로직 → app/api/ Route Handler
UI 상태/이벤트 → components/ (use client)
데이터 표시만 → app/ 서버 컴포넌트
공통 유틸 → lib/
재사용 UI → components/ui/
```
