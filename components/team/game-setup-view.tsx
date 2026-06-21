"use client";

import { Play } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { getTeamById } from "@/lib/supabase/game";
import { getSlimeImage } from "@/lib/utils";

type TeamMember = NonNullable<Awaited<ReturnType<typeof getTeamById>>>["team_members"][number];

export interface GameSettings {
  durationMinutes: number;
  teamLife: number;
  restInterval: number;
  selectedMemberIds: string[];
}

interface GameSetupViewProps {
  teamId: string;
  teamMembers: TeamMember[];
  currentUserId: string;
  onlineUserIds: Set<string>;
  onStart: (settings: GameSettings) => void;
  onCancel: () => void;
  isStarting: boolean;
}

export function GameSetupView({
  teamMembers,
  currentUserId,
  onlineUserIds,
  onStart,
  onCancel,
  isStarting,
}: GameSetupViewProps) {
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set([currentUserId]));

  const toggleMember = (userId: string) => {
    if (userId === currentUserId) return;
    if (!onlineUserIds.has(userId)) return;

    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMemberIds.size === 0) {
      alert("참여할 멤버를 1명 이상 선택해주세요.");
      return;
    }
    onStart({
      durationMinutes,
      teamLife: 5, // 입력란 지우고 라이프 개수를 기본값 5로 고정 전송
      restInterval: 0, // 기본값 고정 전송
      selectedMemberIds: Array.from(selectedMemberIds),
    });
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-300 animate-in fade-in">
      <Card className="w-full max-w-2xl border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl duration-300 animate-in zoom-in-95">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">게임 설정</CardTitle>
          <CardDescription className="text-zinc-400">
            진행할 게임의 상세 설정과 참여 멤버를 선택하세요.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleStart}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="durationMinutes" className="font-semibold text-zinc-200">
                목표 진행 시간 (분)
              </Label>
              <Input
                id="durationMinutes"
                type="number"
                min={1}
                step={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                required
                className="border-zinc-700 bg-zinc-950 text-white focus:border-white focus:ring-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-zinc-200">
                참여 멤버 선택{" "}
                <span className="font-normal text-zinc-500">
                  (현재 {selectedMemberIds.size}명 선택됨)
                </span>
              </Label>
              <div className="max-h-48 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-950 p-2">
                {teamMembers.map((member) => {
                  const profile = Array.isArray(member.profiles)
                    ? member.profiles[0]
                    : member.profiles;
                  const userName = profile?.user_name ?? "알 수 없음";
                  const isCurrentUser = member.user_id === currentUserId;
                  const isOnline = onlineUserIds.has(member.user_id);
                  const isDisabled = isCurrentUser || !isOnline;
                  const isSelected = selectedMemberIds.has(member.user_id);

                  // avatar_face 값을 가져와서 유틸리티 함수에 전달
                  const avatarColor = profile?.avatar_color ?? "blue";
                  const avatarFace = profile?.avatar_face ?? 1;
                  const slimeSrc = getSlimeImage(avatarColor, avatarFace);

                  return (
                    <label
                      key={member.user_id}
                      className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                        isDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-zinc-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMember(member.user_id)}
                        disabled={isDisabled}
                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-white"
                      />

                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slimeSrc}
                        alt="Slime Avatar"
                        className="h-8 w-8 flex-shrink-0 object-contain [image-rendering:pixelated]"
                        draggable={false}
                      />

                      <span className="text-sm font-medium text-zinc-200">
                        {userName}
                        {isCurrentUser && (
                          <span className="ml-1 text-xs text-zinc-500">(본인)</span>
                        )}
                      </span>
                      <span
                        className={`ml-auto h-2.5 w-2.5 flex-shrink-0 rounded-full ${isOnline ? "bg-green-400" : "bg-zinc-500"}`}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t border-zinc-800 pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={selectedMemberIds.size === 0 || isStarting}
              className="bg-white px-8 font-bold text-zinc-950 transition-colors hover:bg-zinc-200"
            >
              {isStarting ? (
                "시작 중..."
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" fill="currentColor" /> 게임 시작
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
