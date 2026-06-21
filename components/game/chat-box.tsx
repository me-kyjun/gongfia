"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { getChatMessages } from "@/lib/supabase/game";

type ChatMessage = Awaited<ReturnType<typeof getChatMessages>>[number];

interface ChatBoxProps {
  gameId: string;
  currentUserId: string;
}

/**
 * 투표 화면 하단 실시간 채팅창.
 * - 초기 메시지 목록 로드 + Realtime INSERT 구독으로 즉시 반영
 * - 본인/타인 메시지 정렬 구분, 자동 스크롤
 */
export function ChatBox({ gameId, currentUserId }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // 초기 메시지 로드
  useEffect(() => {
    fetch(`/api/games/${gameId}/chats`)
      .then((r) => r.json())
      .then(({ messages: initial }) => {
        if (Array.isArray(initial)) setMessages(initial);
      });
  }, [gameId]);

  // 메시지 갱신 시 스크롤 하단 이동
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Realtime 채팅 구독
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const setup = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }
      if (cancelled) return;

      const channel = supabase
        .channel(`game-chats:${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "game_chats",
            filter: `game_id=eq.${gameId}`,
          },
          async () => {
            const res = await fetch(`/api/games/${gameId}/chats`);
            const { messages: updated } = await res.json();
            if (Array.isArray(updated)) setMessages(updated);
          },
        )
        .subscribe();

      return () => {
        cancelled = true;
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setup();
    return () => {
      cancelled = true;
      cleanup.then((fn) => fn?.());
    };
  }, [gameId]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await fetch(`/api/games/${gameId}/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      setInput("");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl bg-zinc-200 p-3">
      {/* 메시지 목록 */}
      <div className="mb-2 flex h-64 flex-col gap-1 overflow-y-auto px-1">
        {messages.map((msg) => {
          const isMine = msg.user_id === currentUserId;
          const profile = Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles;
          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
              {!isMine && (
                <span className="mb-0.5 text-xs text-zinc-500">{profile?.user_name ?? "?"}</span>
              )}
              <span
                className={`max-w-[75%] break-words rounded-xl px-3 py-1.5 text-sm ${
                  isMine ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
                }`}
              >
                {msg.message}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="채팅채팅"
          className="flex-1 rounded-xl bg-zinc-100 px-4 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          maxLength={200}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white transition-all hover:bg-black disabled:opacity-40"
          aria-label="전송"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
