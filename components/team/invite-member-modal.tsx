"use client";

import { Search, UserPlus } from "lucide-react";
import { useState } from "react";

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
import { createClient } from "@/lib/supabase/client";

interface SearchUser {
  id: string;
  user_name: string;
  email: string | null;
}

interface InviteMemberModalProps {
  teamId: string;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  // 최대 정원 검사를 위한 프로퍼티 추가
  currentMemberCount: number;
  maxCapacity: number;
}

export function InviteMemberModal({
  teamId,
  currentUserId,
  isOpen,
  onClose,
  currentMemberCount,
  maxCapacity,
}: InviteMemberModalProps) {
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // 브라우저 alert 대체용 커스텀 모달 상태
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, message: "" });

  // 팀 정원 초과 여부 확인
  const isTeamFull = currentMemberCount >= maxCapacity;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_name, email")
        .neq("id", currentUserId)
        .or(`user_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      const pgError = error as { message?: string; code?: string; details?: string };
      setAlertModal({
        isOpen: true,
        message: `검색 오류: ${pgError?.message || "알 수 없는 오류"}`,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async (targetUser: SearchUser) => {
    if (isTeamFull) {
      setAlertModal({ isOpen: true, message: "팀 정원이 초과되어 더 이상 초대할 수 없습니다." });
      return;
    }

    setIsInviting(true);
    try {
      const { error } = await supabase.from("team_members").insert({
        team_id: teamId,
        user_id: targetUser.id,
        role: "member",
        joined_at: new Date().toISOString(),
      });

      if (error) {
        if (error.code === "23505") {
          setAlertModal({ isOpen: true, message: "이미 팀에 가입되어 있거나 초대된 멤버입니다." });
        } else {
          throw error;
        }
        return;
      }

      setAlertModal({
        isOpen: true,
        message: `${targetUser.user_name} 님을 팀에 초대(추가)했습니다!`,
        onConfirm: () => {
          onClose();
          setSearchQuery("");
          setSearchResults([]);
        },
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      setAlertModal({ isOpen: true, message: `초대 오류: ${err?.message || "알 수 없는 오류"}` });
    } finally {
      setIsInviting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-300 animate-in fade-in">
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 shadow-2xl duration-300 animate-in zoom-in-95">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white">멤버 초대</CardTitle>
                <CardDescription className="mt-1 text-zinc-400">
                  유저 이름이나 이메일로 검색하여 팀에 초대하세요.
                  <br />
                  <span
                    className={
                      isTeamFull ? "font-semibold text-red-400" : "font-semibold text-emerald-400"
                    }
                  >
                    현재 인원: {currentMemberCount} / {maxCapacity}명
                  </span>
                </CardDescription>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 transition-colors hover:text-white"
                aria-label="닫기"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="ex) pixxy 또는 email@example.com"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-zinc-700 bg-zinc-950 text-white placeholder:text-zinc-500 focus:border-white focus:ring-white"
              />
              <Button
                type="submit"
                disabled={isSearching}
                className="bg-white text-zinc-950 hover:bg-zinc-200 active:bg-zinc-300"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
              {searchResults.length === 0 && !isSearching && searchQuery && (
                <p className="py-4 text-center text-sm text-zinc-400">검색 결과가 없습니다.</p>
              )}

              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-950 p-3"
                >
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate font-semibold text-zinc-100">{user.user_name}</span>
                    <span className="truncate text-xs text-zinc-400">
                      {user.email ?? "이메일 비공개"}
                    </span>
                  </div>

                  {/* 정원 초과 시 버튼 텍스트 변경 및 비활성화 */}
                  <Button
                    size="sm"
                    onClick={() => handleInvite(user)}
                    disabled={isInviting || isTeamFull}
                    className="ml-2 shrink-0 bg-white font-bold text-zinc-950 hover:bg-zinc-200 active:bg-zinc-300 disabled:opacity-50"
                  >
                    <UserPlus className="mr-1 h-4 w-4" />
                    {isTeamFull ? "초과" : "초대"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 초대 창 내부용 커스텀 알림 모달 (z-index 60으로 초대창 위에 띄움) */}
      {alertModal.isOpen && (
        <div className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-300 animate-in fade-in">
          <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900 shadow-2xl duration-300 animate-in zoom-in-95">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">알림</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-zinc-300">{alertModal.message}</p>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-zinc-800 pt-5">
              <Button
                onClick={() => {
                  const onConfirm = alertModal.onConfirm;
                  setAlertModal({ isOpen: false, message: "" });
                  if (onConfirm) onConfirm();
                }}
                className="bg-white font-bold text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                확인
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
