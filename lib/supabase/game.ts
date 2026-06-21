import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

declare const process: {
  env: {
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
  };
};

const LIFE_POINTS: Record<number, number> = {
  5: 100,
  4: 80,
  3: 60,
  2: 40,
  1: 20,
  0: 0,
};

async function createSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: object }>) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]),
          );
        },
      },
    },
  );
}

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseClient>>;

async function getCurrentUser(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Unauthorized");
  return data.user;
}

export async function listMyTeams() {
  const supabase = await createSupabaseClient();
  const user = await getCurrentUser(supabase);

  const { data, error } = await supabase
    .from("team_members")
    .select("team_id, role, joined_at, teams(*)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createTeam({
  name,
  max_members = 6,
}: {
  name: string;
  max_members?: number;
}) {
  const supabase = await createSupabaseClient();
  const user = await getCurrentUser(supabase);

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({ name, max_members, owner_id: user.id })
    .select()
    .single();

  if (teamError || !team) throw teamError ?? new Error("팀 생성 실패");

  const { error: memberError } = await supabase
    .from("team_members")
    .insert({ team_id: team.id, user_id: user.id, role: "owner" });

  if (memberError) throw memberError;

  return team;
}

export async function getTeamById(teamId: string) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("teams")
    .select("*, team_members(*, profiles(id, user_name, avatar_color, avatar_face))")
    .eq("id", teamId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("팀을 찾을 수 없습니다.");
  return data;
}

export async function getTeamMembers(teamId: string) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("team_members")
    .select("*, profiles(id, user_name, avatar_color, avatar_face)")
    .eq("team_id", teamId);

  if (error) throw error;
  return data ?? [];
}

export async function joinTeam(teamId: string) {
  const supabase = await createSupabaseClient();
  const user = await getCurrentUser(supabase);

  const { data: existing } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const { data: team } = await supabase
    .from("teams")
    .select("id, max_members")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) throw new Error("팀이 존재하지 않습니다.");

  const { count } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);

  if ((count ?? 0) >= team.max_members) throw new Error("팀 인원이 가득 찼습니다.");

  const { data, error } = await supabase
    .from("team_members")
    .insert({ team_id: teamId, user_id: user.id, role: "member" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createGameSession({
  team_id,
  duration_minutes = 60,
  team_life = 5,
  rest_interval = 50,
}: {
  team_id: string;
  duration_minutes?: number;
  team_life?: number;
  rest_interval?: number;
}) {
  const supabase = await createSupabaseClient();
  const user = await getCurrentUser(supabase);

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", team_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership?.role !== "owner") throw new Error("방장만 게임을 시작할 수 있습니다.");

  const { data, error } = await supabase
    .from("game_sessions")
    .insert({ team_id, duration_minutes, team_life, rest_interval, status: "waiting" })
    .select()
    .single();

  if (error || !data) throw error ?? new Error("세션 생성 실패");
  return data;
}

export async function startGame(gameId: string) {
  const supabase = await createSupabaseClient();
  const endTime = new Date();

  const { data: session } = await supabase
    .from("game_sessions")
    .select("duration_minutes")
    .eq("id", gameId)
    .single();

  endTime.setMinutes(endTime.getMinutes() + (session?.duration_minutes ?? 60));

  const { data, error } = await supabase
    .from("game_sessions")
    .update({
      status: "playing",
      start_time: new Date().toISOString(),
      end_time: endTime.toISOString(),
    })
    .eq("id", gameId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function transitionToVoting(gameId: string) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("game_sessions")
    .update({ status: "voting" })
    .eq("id", gameId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function finishGame(gameId: string) {
  const adminSupabase = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const { data: session } = await adminSupabase
    .from("game_sessions")
    .select("team_id, team_life, status")
    .eq("id", gameId)
    .single();

  if (!session) throw new Error("세션을 찾을 수 없습니다.");
  if (session.status === "finished") return { earned_points: 0 };

  const { data: participants } = await adminSupabase
    .from("game_participants")
    .select("user_id")
    .eq("game_id", gameId);

  const participantIds = (participants || []).map((p) => p.user_id);

  const { data: votes } = await adminSupabase
    .from("votes")
    .select("target_id")
    .eq("game_id", gameId);

  const losers: string[] = [];
  const hasVoted = votes && votes.length > 0;

  if (hasVoted) {
    const tally: Record<string, number> = {};
    for (const v of votes) {
      if (v.target_id) {
        tally[v.target_id] = (tally[v.target_id] || 0) + 1;
      }
    }
    let maxVotes = 0;
    for (const count of Object.values(tally)) {
      if (count > maxVotes) maxVotes = count;
    }
    for (const [tid, count] of Object.entries(tally)) {
      if (count === maxVotes) losers.push(tid);
    }
  }

  let profileUpdates: Promise<unknown>[] = [];
  if (participantIds.length > 0) {
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("*")
      .in("id", participantIds);

    const profileMap = new Map();
    if (profiles) {
      profiles.forEach((p) => {
        profileMap.set(p.id, p.personal_points ?? 0);
      });
    }

    profileUpdates = participantIds.map(async (userId) => {
      const isLoser = losers.includes(userId);

      // ✅ 개인 포인트 차등 지급 계산 로직
      let pointsToAdd = 10;
      if (hasVoted) {
        pointsToAdd = isLoser ? 2 : 5;
      }

      const currentPoints = profileMap.get(userId) ?? 0;

      const res = await adminSupabase
        .from("profiles")
        .update({ personal_points: currentPoints + pointsToAdd })
        .eq("id", userId);
      return res;
    });
  }

  const earnedPoints = LIFE_POINTS[Math.max(0, Math.min(5, session.team_life ?? 0))] ?? 0;

  const { data: currentTeam } = await adminSupabase
    .from("teams")
    .select("room_points")
    .eq("id", session.team_id as string)
    .single();

  const newPoints = (currentTeam?.room_points ?? 0) + earnedPoints;

  const results = await Promise.all([
    (async () =>
      await adminSupabase.from("game_sessions").update({ status: "finished" }).eq("id", gameId))(),
    (async () =>
      await adminSupabase
        .from("teams")
        .update({ room_points: newPoints })
        .eq("id", session.team_id as string))(),
    ...profileUpdates,
  ]);

  const sessionError = results[0].error;
  const pointsError = results[1].error;

  if (sessionError) throw sessionError;
  if (pointsError) throw pointsError;

  return { earned_points: earnedPoints };
}

export async function deductLife(gameId: string) {
  const adminSupabase = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const { data: session, error: fetchError } = await adminSupabase
    .from("game_sessions")
    .select("team_life, status")
    .eq("id", gameId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!session) throw new Error("세션을 찾을 수 없습니다.");
  if (session.status !== "playing") return session;

  const newLife = Math.max(0, (session.team_life ?? 0) - 1);

  const { data, error } = await adminSupabase
    .from("game_sessions")
    .update({ team_life: newLife })
    .eq("id", gameId)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("업데이트된 세션을 반환받지 못했습니다.");
  }

  return data;
}

export async function getGameSession(gameId: string) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("game_sessions")
    .select("*, game_participants(*, profiles(id, user_name, avatar_color, avatar_face))")
    .eq("id", gameId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("게임 세션을 찾을 수 없습니다.");
  return data;
}

export async function listGameSessions(teamId: string) {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data ?? [];
}

export async function joinGame(gameId: string) {
  const supabase = await createSupabaseClient();
  const user = await getCurrentUser(supabase);

  const { data: existing } = await supabase
    .from("game_participants")
    .select("*")
    .eq("game_id", gameId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("game_participants")
    .insert({ game_id: gameId, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function recordGameLog({
  game_id,
  event_type,
}: {
  game_id: string;
  event_type: "leave" | "return";
}) {
  const supabase = await createSupabaseClient();
  const user = await getCurrentUser(supabase);

  const { data, error } = await supabase
    .from("game_logs")
    .insert({ game_id, user_id: user.id, event_type })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getGameLogStats(gameId: string) {
  const supabase = await createSupabaseClient();

  const { data: logs, error } = await supabase
    .from("game_logs")
    .select("user_id, event_type, timestamp")
    .eq("game_id", gameId)
    .order("timestamp", { ascending: true });

  if (error) throw error;

  const stats: Record<string, { leave_count: number; total_away_ms: number }> = {};
  const leaveTimestamps: Record<string, number> = {};

  for (const log of logs ?? []) {
    const uid = log.user_id ?? "";
    if (!stats[uid]) stats[uid] = { leave_count: 0, total_away_ms: 0 };

    if (log.event_type === "leave") {
      stats[uid].leave_count += 1;
      leaveTimestamps[uid] = new Date(log.timestamp ?? "").getTime();
    } else if (log.event_type === "return" && leaveTimestamps[uid]) {
      const awayMs = new Date(log.timestamp ?? "").getTime() - leaveTimestamps[uid];
      stats[uid].total_away_ms += awayMs;
      delete leaveTimestamps[uid];
    }
  }

  return stats;
}

export async function sendChatMessage({ game_id, message }: { game_id: string; message: string }) {
  if (!message.trim()) throw new Error("메시지를 입력해주세요.");
  const supabase = await createSupabaseClient();
  const user = await getCurrentUser(supabase);

  const { data, error } = await supabase
    .from("game_chats")
    .insert({ game_id, user_id: user.id, message: message.trim() })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getChatMessages(gameId: string) {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("game_chats")
    .select("id, message, created_at, user_id, profiles(user_name, avatar_color, avatar_face)")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

export async function castVote({ game_id, target_id }: { game_id: string; target_id: string }) {
  const supabase = await createSupabaseClient();
  const user = await getCurrentUser(supabase);

  const { data, error } = await supabase
    .from("votes")
    .insert({ game_id, voter_id: user.id, target_id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getVoteResults(gameId: string) {
  const supabase = await createSupabaseClient();
  const { data: votes, error } = await supabase
    .from("votes")
    .select("target_id, profiles!votes_target_id_fkey(user_name, avatar_color, avatar_face)")
    .eq("game_id", gameId);

  if (error) throw error;

  const tally: Record<
    string,
    { user_name: string; avatar_color: string; avatar_face: number; count: number }
  > = {};

  for (const vote of votes ?? []) {
    const tid = vote.target_id ?? "";
    if (!tally[tid]) {
      const profile = Array.isArray(vote.profiles) ? vote.profiles[0] : vote.profiles;
      tally[tid] = {
        user_name: profile?.user_name ?? "알 수 없음",
        avatar_color: profile?.avatar_color ?? "#6366f1",
        avatar_face: profile?.avatar_face ?? 1,
        count: 0,
      };
    }
    tally[tid].count += 1;
  }

  return Object.entries(tally)
    .map(([id, info]) => ({ id, ...info }))
    .sort((a, b) => b.count - a.count);
}
