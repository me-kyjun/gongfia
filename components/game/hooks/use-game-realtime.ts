"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type GameSessionRow = Database["public"]["Tables"]["game_sessions"]["Row"];

/** Presence 상태 개별 항목 타입 */
interface PresenceState {
  user_id: string;
}

interface UseGameRealtimeOptions {
  gameId: string;
  /** 현재 유저 ID — Presence track에 사용 */
  userId: string;
  /** game_sessions UPDATE 이벤트 시 호출 */
  onSessionUpdate: (updated: Partial<GameSessionRow>) => void;
  /** Presence로 집계한 현재 접속자 수가 바뀔 때 호출 (절대값) */
  onConnectedCountChange?: (count: number) => void;
}

/**
 * 게임 세션 상태와 접속자 수를 실시간으로 구독하는 훅.
 * - game_sessions UPDATE: 상태 전환(waiting→playing→voting) + 라이프 변화 감지
 * - Presence: 실제로 게임 화면에 접속해 있는 인원 수 집계
 *
 * GameScreen에서만 호출하여 뷰 전환 시에도 구독이 유지되도록 한다.
 *
 * 중요: createBrowserClient의 onAuthStateChange는 비동기로 발화되므로,
 * 채널 구독 전에 setAuth를 명시적으로 await해야 Realtime이 사용자 권한으로 연결되어
 * RLS가 적용된 game_sessions의 postgres_changes 이벤트를 받을 수 있다.
 */
export function useGameRealtime({
  gameId,
  userId,
  onSessionUpdate,
  onConnectedCountChange,
}: UseGameRealtimeOptions) {
  useEffect(() => {
    const supabase = createClient();
    let sessionChannel: ReturnType<typeof supabase.channel> | null = null;
    let presenceChannel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const setup = async () => {
      // Realtime이 사용자 JWT로 연결되도록 구독 전에 토큰을 명시적으로 설정한다.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }
      if (cancelled) return;

      // game_sessions UPDATE — 상태 전환 / 라이프 변화 감지
      sessionChannel = supabase
        .channel(`game-session:${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "game_sessions",
            filter: `id=eq.${gameId}`,
          },
          (payload) => {
            onSessionUpdate(payload.new as Partial<GameSessionRow>);
          },
        )
        .subscribe();

      // Presence — 실제 접속자 수 집계
      presenceChannel = supabase.channel(`game-presence:${gameId}`, {
        config: { presence: { key: userId } },
      });

      const handlePresenceSync = () => {
        const state = presenceChannel!.presenceState<PresenceState>();
        // 같은 user_id가 여러 클라이언트로 접속해도 1명으로 집계
        const ids = new Set<string>();
        Object.values(state).forEach((presences) => {
          presences.forEach((p) => ids.add(p.user_id));
        });
        onConnectedCountChange?.(ids.size);
      };

      presenceChannel
        .on("presence", { event: "sync" }, handlePresenceSync)
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await presenceChannel!.track({ user_id: userId });
            // track 직후 수동 sync 1회 실행 — 이미 접속한 유저를 즉시 반영
            handlePresenceSync();
          }
        });
    };

    setup();

    return () => {
      cancelled = true;
      if (sessionChannel) supabase.removeChannel(sessionChannel);
      if (presenceChannel) supabase.removeChannel(presenceChannel);
    };
  }, [gameId, userId, onSessionUpdate, onConnectedCountChange]);
}
