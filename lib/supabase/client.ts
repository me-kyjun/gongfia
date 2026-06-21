import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트를 생성한다.
 *
 * createBrowserClient는 쿠키 기반 SSR 세션을 사용하지만, Realtime WebSocket에
 * 사용자 JWT를 자동으로 전파하지 못한다. 그 결과 Realtime이 anon 권한으로 연결되어
 * RLS가 적용된 테이블(예: game_sessions)의 postgres_changes 이벤트를 받지 못한다.
 * 이를 막기 위해 인증 상태가 바뀔 때마다(INITIAL_SESSION 포함) Realtime 토큰을
 * 명시적으로 설정한다.
 */
export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: {
        // 개발 환경(HTTP IP 접속)에서는 secure 옵션을 false로 설정
        secure: process.env.NODE_ENV === "production",
      },
    },
  );

  client.auth.onAuthStateChange((_event, session) => {
    if (session?.access_token) {
      client.realtime.setAuth(session.access_token);
    }
  });

  return client;
}
