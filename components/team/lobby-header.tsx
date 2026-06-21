"use client";

import { Coins, LogOut, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface LobbyHeaderProps {
  teamId: string;
  isOwner: boolean;
  isEditMode: boolean;
  roomPoints: number;
  onToggleEditMode: () => void;
  onInviteClick: () => void;
}

export function LobbyHeader({
  teamId,
  isOwner,
  isEditMode,
  roomPoints,
  onToggleEditMode,
  onInviteClick,
}: LobbyHeaderProps) {
  const router = useRouter();

  return (
    <>
      <div className="absolute left-6 top-6 z-20 flex flex-col gap-3">
        <Button
          variant="secondary"
          className="bg-white/95 font-bold text-zinc-950 shadow-lg transition-transform hover:scale-105 hover:bg-white active:scale-95"
          onClick={onToggleEditMode}
        >
          {isEditMode ? "나가기" : "편집 모드"}
        </Button>
        {isOwner && (
          <div
            className={`transition-all duration-500 ease-in-out ${isEditMode ? "pointer-events-none -translate-x-12 opacity-0" : "translate-x-0 opacity-100"}`}
          >
            <Button
              variant="secondary"
              className="w-full bg-white/95 font-bold text-zinc-950 shadow-lg transition-transform hover:scale-105 hover:bg-white active:scale-95"
              onClick={onInviteClick}
            >
              <UserPlus className="mr-2 h-4 w-4" /> 멤버 초대
            </Button>
          </div>
        )}
      </div>

      <div
        className={`absolute right-6 top-6 z-20 flex items-center gap-3 transition-all duration-500 ease-in-out ${isEditMode ? "pointer-events-none translate-x-12 opacity-0" : "translate-x-0 opacity-100"}`}
      >
        <button
          onClick={() => router.push(`/team/${teamId}/shop`)}
          title="가구 상점으로 이동"
          className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white/95 px-4 font-bold text-zinc-900 shadow-lg transition-all hover:scale-105 hover:bg-white active:scale-95"
        >
          <Coins className="h-5 w-5 text-amber-500" />
          <span>{roomPoints} P</span>
        </button>
        <Button
          variant="secondary"
          className="h-10 bg-white/95 font-bold text-zinc-600 shadow-lg transition-transform hover:scale-105 hover:bg-white hover:text-zinc-950 active:scale-95"
          onClick={() => router.push("/home")}
        >
          <LogOut className="mr-2 h-4 w-4" /> 나가기
        </Button>
      </div>
    </>
  );
}
