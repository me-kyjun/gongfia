"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function ChangePasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("모든 필드를 입력하세요.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (newPassword.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. 현재 비밀번호로 다시 인증 (선택사항이지만 보안상 권장)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) throw new Error("사용자 정보를 찾을 수 없습니다.");

      // 2. 새 비밀번호로 업데이트
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      alert("비밀번호가 변경되었습니다.");

      // 입력 필드 초기화
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 변경 실패");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-zinc-900">비밀번호 변경</CardTitle>
          <CardDescription className="text-zinc-500">계정의 비밀번호를 변경합니다.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleChangePassword}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password" className="text-zinc-900">
                  현재 비밀번호
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="현재 비밀번호"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-400"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new-password" className="text-zinc-900">
                  새 비밀번호
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="새 비밀번호"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-400"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm-password" className="text-zinc-900">
                  비밀번호 확인
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="비밀번호 확인"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-400"
                  required
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "변경 중..." : "변경"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
