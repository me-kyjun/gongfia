"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
}

export function LobbyAlertModal({ isOpen, message, onConfirm }: AlertModalProps) {
  if (!isOpen) return null;
  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-300 animate-in fade-in">
      <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900 shadow-2xl duration-300 animate-in zoom-in-95">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">알림</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base text-zinc-300">{message}</p>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-zinc-800 pt-5">
          <Button
            onClick={onConfirm}
            className="bg-white font-bold text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            확인
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  actionType: "kick" | "leave" | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LobbyConfirmModal({
  isOpen,
  message,
  actionType,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-300 animate-in fade-in">
      <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900 shadow-2xl duration-300 animate-in zoom-in-95">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">
            {actionType === "kick" ? "멤버 추방" : "팀 탈퇴"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base text-zinc-300">{message}</p>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t border-zinc-800 pt-5">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            취소
          </Button>
          <Button
            onClick={onConfirm}
            className={
              actionType === "kick"
                ? "bg-red-500 font-bold text-white hover:bg-red-600"
                : "bg-white font-bold text-zinc-950 transition-colors hover:bg-zinc-200"
            }
          >
            확인
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
