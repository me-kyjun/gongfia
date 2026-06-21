"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/types/database";

/** teams 테이블 Row 타입 */
type Team = Tables<"teams">;

export default function HomePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [teamName, setTeamName] = useState("");
  const [maxMembers, setMaxMembers] = useState<number>(4);
  const [isCreating, setIsCreating] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/teams");
      if (!res.ok) throw new Error("팀 목록을 불러오지 못했습니다.");
      const data = await res.json();
      // listMyTeams가 team_members 조인으로 반환하므로 teams 필드 추출
      const teamList = (data.teams ?? [])
        .map((item: { teams: Team | null }) => item.teams)
        .filter(Boolean) as Team[];
      setTeams(teamList);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName, max_members: maxMembers }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "팀 생성 실패");

      setIsModalOpen(false);
      setTeamName("");
      setMaxMembers(4);
      fetchTeams();
    } catch (error) {
      console.error("팀 생성 에러:", error);
      alert(`오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-zinc-50 p-6 pb-24 md:p-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <h1
            className="select-none text-6xl font-bold tracking-wider text-zinc-900"
            style={{ fontFamily: "var(--font-pixelify-sans)" }}
          >
            GongFia
          </h1>

          <div className="mt-3 flex items-center gap-3 text-sm font-semibold text-zinc-500">
            {/* 상점 버튼 클릭 시 개인 상점으로 이동되도록 수정 */}
            <button
              type="button"
              className="transition-colors hover:text-zinc-900"
              onClick={() => router.push("/home/shop")}
            >
              상점
            </button>
            <span className="select-none text-zinc-300">|</span>
            <button
              type="button"
              className="transition-colors hover:text-zinc-900"
              onClick={() => router.push("/profile")}
            >
              마이페이지
            </button>
            <span className="select-none text-zinc-300">|</span>
            <button
              type="button"
              className="transition-colors hover:text-red-600"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-zinc-400">로딩 중...</div>
        ) : teams.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white">
            <p className="text-zinc-500">참여 중인 팀이 없습니다.</p>
            <p className="mt-1 text-sm text-zinc-400">
              우측 하단의 + 버튼을 눌러 새 팀을 만들어보세요!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {teams.map((team) => (
              <Card
                key={team.id}
                className="flex flex-col justify-between border-zinc-200 shadow-sm transition-shadow hover:shadow-md"
                style={{ backgroundColor: "#ffffff" }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="truncate text-lg font-bold text-zinc-950">
                    {team.name}
                  </CardTitle>
                  <CardDescription className="text-zinc-600">
                    정원: {team.max_members}명
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-sm font-medium text-zinc-800">
                    팀 포인트: {team.room_points ?? 0}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-zinc-900 font-semibold text-white transition-colors hover:bg-[#000000] focus:bg-[#000000] active:bg-[#000000]"
                    type="button"
                    onClick={() => router.push(`/team/${team.id}`)}
                  >
                    입장하기
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 플로팅 버튼 (FAB) */}
      <div className="pointer-events-none fixed bottom-8 left-0 right-0 z-40 flex justify-center px-6 md:px-12">
        <div className="flex w-full max-w-6xl justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-all hover:scale-105 hover:bg-[#000000] active:scale-95 md:h-16 md:w-16"
            aria-label="팀 생성"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 팀 생성 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <Card
            className="w-full max-w-md border-zinc-200 shadow-xl duration-200 animate-in fade-in zoom-in-95"
            style={{ backgroundColor: "#ffffff" }}
          >
            <CardHeader>
              <CardTitle className="text-xl font-bold text-zinc-950">새 팀 생성</CardTitle>
              <CardDescription className="text-zinc-600">
                함께 공부할 팀의 정보를 입력해주세요.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateTeam}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName" className="font-semibold text-zinc-900">
                    팀 이름
                  </Label>
                  <Input
                    id="teamName"
                    placeholder="팀 이름을 입력하세요"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    autoComplete="off"
                    className="border-zinc-300 bg-white text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-zinc-950"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxMembers" className="font-semibold text-zinc-900">
                    최대 인원
                  </Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    min={2}
                    max={10}
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                    required
                    className="border-zinc-300 bg-white text-zinc-950 focus:border-zinc-950 focus:ring-zinc-950"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreating}
                  className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="bg-zinc-900 font-semibold text-white transition-colors hover:bg-[#000000] active:bg-[#000000]"
                >
                  {isCreating ? "생성 중..." : "팀 만들기"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </main>
  );
}
