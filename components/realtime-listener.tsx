"use client";

import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const TABLES = [
  "profiles",
  "teams",
  "team_members",
  "game_sessions",
  "game_participants",
  "votes",
  "game_chats",
];

type Counts = Record<string, number>;

type EventEntry = {
  table: string;
  eventType: string;
  time: string;
};

export function RealtimeListener() {
  const [counts, setCounts] = useState<Counts>({});
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function loadCounts() {
      const nextCounts: Counts = {};
      await Promise.all(
        TABLES.map(async (table) => {
          const { count, error } = await supabase
            .from(table)
            .select("id", { count: "exact", head: true });
          if (!error && mounted) {
            nextCounts[table] = count ?? 0;
          }
        }),
      );
      if (mounted) setCounts(nextCounts);
    }

    loadCounts();

    const subscribedTables = ["teams", "team_members", "game_sessions", "votes", "game_chats"];

    const channel = supabase.channel("realtime-listener");

    subscribedTables.forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
        if (!mounted) return;
        setEvents((prev) => [
          { table, eventType: payload.eventType, time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 8),
        ]);
        loadCounts();
      });
    });

    channel.subscribe((statusUpdate: REALTIME_SUBSCRIBE_STATES) => {
      if (!mounted) return;
      setStatus(String(statusUpdate));
    });

    return () => {
      mounted = false;
      void channel.unsubscribe();
    };
  }, []);

  return (
    <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Realtime 상태</p>
          <p className="mt-1 font-semibold">{status}</p>
        </div>
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          public schema 구독
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {TABLES.map((table) => (
          <div key={table} className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{table}</p>
            <p className="mt-2 text-xl font-bold text-zinc-900">{counts[table] ?? 0}</p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">최근 이벤트</p>
        <div className="mt-2 flex max-h-28 flex-col gap-1 overflow-y-auto rounded-xl bg-zinc-100 p-3 text-xs text-zinc-700">
          {events.length === 0 ? (
            <p className="text-zinc-500">실시간 이벤트 대기 중...</p>
          ) : (
            events.map((event, index) => (
              <div key={`${event.table}-${index}`}>
                <span className="font-semibold">{event.table}</span>
                <span> · {event.eventType}</span>
                <span className="ml-2 text-zinc-500">{event.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
