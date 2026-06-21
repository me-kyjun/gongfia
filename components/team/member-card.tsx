"use client";

import { LogOut, UserMinus } from "lucide-react";

import { cn } from "@/lib/utils";
import { getSlimeImage } from "@/lib/utils";

interface MemberCardProps {
  userId?: string;
  userName: string;
  avatarColor: string;
  avatarFace?: number;
  isOnline: boolean;
  isOwner: boolean;

  // 팝업 버튼 제어를 위한 속성
  actionType?: "kick" | "leave" | null;
  showAction?: boolean;
  size?: "sm" | "md";
  onCardClick?: (e: React.MouseEvent) => void;
  onActionClick?: (e: React.MouseEvent) => void;
}

export function MemberCard({
  userName,
  avatarColor,
  avatarFace = 1,
  isOnline,
  isOwner,
  actionType = null,
  showAction = false,
  size = "md",
  onCardClick,
  onActionClick,
}: MemberCardProps) {
  const isInteractive = actionType !== null;
  const isSm = size === "sm";
  const slimeImageSrc = getSlimeImage(avatarColor, avatarFace);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "group relative transition-transform", // hover 상태 감지를 위한 group 클래스 추가
          isInteractive && "cursor-pointer hover:scale-105 active:scale-95",
        )}
        onClick={isInteractive ? onCardClick : undefined}
      >
        <div
          className={cn(
            "relative flex items-center justify-center font-bold text-white drop-shadow-lg",
            isSm ? "h-16 w-16 text-2xl" : "h-20 w-20 text-3xl",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slimeImageSrc}
            alt="Slime Avatar"
            className={cn(
              "absolute inset-0 h-full w-full object-contain transition-opacity duration-200 [image-rendering:pixelated]",
              "opacity-50", // 기본적으로 50% 불투명도 적용
              isInteractive && "group-hover:opacity-100 group-active:opacity-100", // 상호작용 가능 시 호버/터치하면 100%
              showAction && "opacity-100", // 액션 버튼(팝업)이 열려있을 때도 100% 유지
            )}
            draggable={false}
          />
        </div>

        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-zinc-950",
            isSm ? "h-3.5 w-3.5" : "h-4 w-4",
            isOnline ? "bg-green-400" : "bg-zinc-500",
          )}
        />

        {showAction && actionType && (
          <div className="absolute left-1/2 top-full z-30 mt-2 flex -translate-x-1/2 justify-center duration-200 animate-in fade-in zoom-in-95">
            <button
              onClick={onActionClick}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-xl transition-transform hover:scale-105 active:scale-95",
                actionType === "kick"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-zinc-700 hover:bg-zinc-800",
              )}
            >
              {actionType === "kick" ? (
                <>
                  <UserMinus size={14} /> 추방
                </>
              ) : (
                <>
                  <LogOut size={14} /> 탈퇴
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="mt-1 flex flex-col items-center gap-0.5">
        <span
          className={cn(
            "truncate font-semibold text-white",
            isSm ? "max-w-[5rem] text-xs" : "max-w-[6rem] text-sm",
          )}
        >
          {userName}
        </span>
        {isOwner && (
          <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold leading-none text-zinc-900">
            방장
          </span>
        )}
      </div>
    </div>
  );
}
