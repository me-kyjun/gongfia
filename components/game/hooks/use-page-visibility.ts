// tu/components/game/hooks/use-page-visibility.ts
"use client";

import { useEffect, useRef } from "react";

interface UsePageVisibilityOptions {
  gameId: string;
  /** playing 상태일 때만 이탈 감지 활성화 */
  isPlaying: boolean;
}

/**
 * Page Visibility API 기반 화면 이탈 감지 훅.
 * isPlaying이 true일 때만 visibilitychange 리스너를 등록한다.
 * leave 이벤트 시 서버가 자동으로 deductLife를 호출한다.
 */
export function usePageVisibility({ gameId, isPlaying }: UsePageVisibilityOptions) {
  const isAwayRef = useRef(false);

  useEffect(() => {
    if (!isPlaying) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "hidden") {
        if (isAwayRef.current) return;
        isAwayRef.current = true;

        try {
          // fetch의 keepalive만으로는 탭 강제 종료 시 연결이 끊겨 서버에서 AbortError(400)가 발생할 수 있습니다.
          // 화면 이탈 시 브라우저 백그라운드 전송을 완벽히 보장하는 sendBeacon을 사용합니다.
          const payload = JSON.stringify({ event_type: "leave" });
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon(`/api/games/${gameId}/logs`, blob);
        } catch {
          // 네트워크 오류는 무시 (게임 진행에 영향 없음)
        }
      } else if (document.visibilityState === "visible") {
        if (!isAwayRef.current) return;
        isAwayRef.current = false;

        try {
          // 화면 복귀 시에는 브라우저가 활성화된 상태이므로 기존처럼 fetch를 사용해도 안전합니다.
          await fetch(`/api/games/${gameId}/logs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_type: "return" }),
            keepalive: true,
          });
        } catch {
          // 네트워크 오류는 무시
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [gameId, isPlaying]);
}
