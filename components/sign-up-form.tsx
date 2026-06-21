"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GoogleAuthButton } from "@/components/google-auth-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// DB 저장용 value를 red, blue, green, yellow 문자열로 변경
// 화면 렌더링을 위해 hex 코드는 별도 속성으로 분리하여 유지
const SLIME_COLORS = [
  { label: "빨강 슬라임", value: "red", hex: "#ef4444" },
  { label: "파랑 슬라임", value: "blue", hex: "#3b82f6" },
  { label: "초록 슬라임", value: "green", hex: "#22c55e" },
  { label: "노랑 슬라임", value: "yellow", hex: "#eab308" },
];

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [avatarColor, setAvatarColor] = useState("red"); // 초기 상태값을 "red"로 변경
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/home`,
          data: {
            user_name: userName,
            avatar_color: avatarColor, // 이제 DB에 "red", "blue" 등의 문자열로 저장됨
          },
        },
      });
      if (error) throw error;
      if (data.session) {
        router.push("/home");
      } else {
        router.push("/auth/sign-up-success");
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>공피아 계정을 만들어보세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="user-name">닉네임</Label>
                <Input
                  id="user-name"
                  type="text"
                  placeholder="게임에서 사용할 닉네임"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>슬라임 색상 선택</Label>
                <div className="flex flex-wrap gap-3">
                  {SLIME_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setAvatarColor(color.value)}
                      className={cn(
                        "h-10 w-10 rounded-full border-2 transition-all",
                        avatarColor === color.value
                          ? "scale-110 border-foreground shadow-md"
                          : "border-transparent",
                      )}
                      style={{ backgroundColor: color.hex }} // 실제 보여지는 색상은 hex 코드로 적용
                      title={color.label}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  선택된 색상: {SLIME_COLORS.find((c) => c.value === avatarColor)?.label}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">비밀번호 확인</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "계정 생성 중..." : "회원가입"}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">또는</span>
                </div>
              </div>
              <GoogleAuthButton label="Google로 회원가입" />
            </div>
            <div className="mt-4 text-center text-sm">
              이미 계정이 있으신가요?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                로그인
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
