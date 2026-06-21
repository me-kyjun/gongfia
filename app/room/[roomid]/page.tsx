"use client";

import { LogOut, Play, Search, Settings, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

// 1. any를 대체할 명시적 타입 인터페이스 정의
interface SearchUser {
  id: string;
  username: string;
  email: string;
}

export default function RoomPage({ params }: { params: Promise<{ roomid: string }> }) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomid;

  const router = useRouter();
  const supabase = createClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // 2. any[] 대신 명시적 타입인 SearchUser[] 사용
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/auth/login");
          return;
        }

        setCurrentUserId(user.id);

        const { data: room, error: roomError } = await supabase
          .from("rooms")
          .select("owner_id, name")
          .eq("id", roomId)
          .single();

        if (roomError || !room) {
          alert("존재하지 않거나 접근할 수 없는 방입니다.");
          router.push("/home");
          return;
        }

        const currentIsOwner = room.owner_id === user.id;
        setIsOwner(currentIsOwner);

        if (!currentIsOwner) {
          const { data: memberData, error: memberError } = await supabase
            .from("room_members")
            .select("role")
            .eq("room_id", roomId)
            .eq("user_id", user.id)
            .maybeSingle();

          if (memberError || !memberData) {
            alert("해당 스터디 룸의 멤버가 아닙니다. 접근 권한이 없습니다.");
            router.push("/home");
            return;
          }
        }
      } catch (err) {
        console.error("방 권한 검증 중 오류 발생:", err);
        router.push("/home");
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [roomId, router, supabase]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email")
        .neq("id", currentUserId || "")
        .or(`username.ilike.%${searchQuery}%,email.eq.${searchQuery}`)
        .limit(5);

      if (error) throw error;
      // 데이터를 SearchUser[] 타입으로 안전하게 단언(Assertion)
      setSearchResults((data as SearchUser[]) || []);
    } catch (error) {
      console.error("검색 오류:", error);
      alert("사용자 검색 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  // 3. targetUser: any 대신 targetUser: SearchUser 사용
  const handleInvite = async (targetUser: SearchUser) => {
    setIsInviting(true);
    try {
      const { error } = await supabase.from("room_members").insert({
        room_id: roomId,
        user_id: targetUser.id,
        role: "participant",
        joined_at: new Date().toISOString(),
      });

      if (error) {
        if (error.code === "23505") {
          alert("이미 이 방에 소속된 멤버입니다.");
        } else {
          throw error;
        }
        return;
      }

      alert(`${targetUser.username}님이 성공적으로 초대되었습니다!`);
      setIsInviteModalOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error: unknown) {
      // 4. catch(error: any) 대신 error: unknown 적용 후 안전한 접근
      console.error("초대 실패:", error);
      const err = error as { message?: string };
      alert(`초대 실패: ${err?.message || "알 수 없는 오류"}`);
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="font-medium text-zinc-500">권한을 확인하고 방에 입장하는 중...</p>
      </div>
    );
  }

  return (
    <main className="relative flex h-screen w-full select-none flex-col overflow-hidden bg-zinc-950">
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="no-scrollbar absolute inset-0 overflow-x-auto overflow-y-hidden"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <div className="pointer-events-none flex h-full w-[200vw] items-center justify-center border-y-8 border-zinc-950 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-900">
          <span className="text-3xl font-bold tracking-widest text-zinc-500 opacity-40">
            [ 좌우로 마우스 드래그 가능한 배경 이미지 영역 ]
          </span>
        </div>
      </div>

      <div className="absolute left-6 top-6 z-10 flex flex-col gap-3">
        <Button
          variant="secondary"
          className="bg-white/95 font-bold text-zinc-950 shadow-lg transition-transform hover:scale-105 hover:bg-white active:scale-95"
          onClick={() => alert("편집 모드로 전환합니다.")}
        >
          편집 모드
        </Button>
        {isOwner && (
          <>
            <Button
              variant="secondary"
              className="bg-white/95 font-bold text-zinc-950 shadow-lg transition-transform hover:scale-105 hover:bg-white active:scale-95"
              onClick={() => setIsInviteModalOpen(true)}
            >
              멤버 초대
            </Button>
            <Button
              variant="secondary"
              className="flex items-center justify-center gap-1 bg-white/95 font-bold text-zinc-950 shadow-lg transition-transform hover:scale-105 hover:bg-white active:scale-95"
              onClick={() => alert("방 설정 기능은 준비 중입니다.")}
            >
              <Settings className="h-4 w-4" />방 설정
            </Button>
          </>
        )}
      </div>

      <div className="absolute right-6 top-6 z-10">
        <Button
          variant="secondary"
          className="bg-white/95 font-bold text-zinc-600 shadow-lg transition-transform hover:scale-105 hover:bg-white hover:text-zinc-950 active:scale-95"
          onClick={() => router.push("/home")}
        >
          <LogOut className="mr-2 h-4 w-4" />
          나가기
        </Button>
      </div>

      <div className="pointer-events-auto absolute bottom-10 left-1/2 z-10 -translate-x-1/2">
        <button
          onClick={() => alert("미디어 재생!")}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-zinc-950 shadow-2xl transition-all hover:scale-110 hover:bg-zinc-200 active:scale-95 md:h-20 md:w-20"
          aria-label="재생"
        >
          <Play className="ml-1 h-8 w-8 md:h-10 md:w-10" fill="currentColor" />
        </button>
      </div>

      {isInviteModalOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <Card
            className="w-full max-w-md border-zinc-200 shadow-xl duration-200 animate-in fade-in zoom-in-95"
            style={{ backgroundColor: "#ffffff" }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-zinc-950">멤버 초대</CardTitle>
                  <CardDescription className="mt-1 text-zinc-600">
                    유저네임 또는 이메일로 사용자를 검색하세요.
                  </CardDescription>
                </div>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="text-zinc-400 transition-colors hover:text-zinc-900"
                >
                  ✕
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="ex) pixxy 또는 email@example.com"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-zinc-300 bg-white text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-zinc-950"
                />
                <Button
                  type="submit"
                  disabled={isSearching}
                  className="bg-zinc-900 text-white hover:bg-[#000000] active:bg-[#000000]"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
                {searchResults.length === 0 && !isSearching && searchQuery && (
                  <p className="py-4 text-center text-sm text-zinc-500">검색 결과가 없습니다.</p>
                )}
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                  >
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate font-semibold text-zinc-900">{user.username}</span>
                      <span className="truncate text-xs text-zinc-500">{user.email}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleInvite(user)}
                      disabled={isInviting}
                      className="ml-2 shrink-0 bg-zinc-900 text-white hover:bg-[#000000] active:bg-[#000000]"
                    >
                      <UserPlus className="mr-1 h-4 w-4" />
                      초대
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
