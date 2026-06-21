"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  { label: "빨강", value: "red", bg: "#ef4444" },
  { label: "노랑", value: "yellow", bg: "#eab308" },
  { label: "초록", value: "green", bg: "#22c55e" },
  { label: "파랑", value: "blue", bg: "#3b82f6" },
];

export function ProfileForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [userName, setUserName] = useState("");
  const [avatarColor, setAvatarColor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const formatErrorMessage = (err: unknown) => {
    if (err instanceof Error) return err.message;
    if (typeof err === "object" && err && "message" in err) {
      return (err as { message?: string }).message ?? "업데이트 실패";
    }
    return String(err ?? "업데이트 실패");
  };

  // 프로필 데이터 불러오기
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/login");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("user_name, avatar_color")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        const meta = user.user_metadata as Record<string, string> | undefined;
        const profileUserName = data?.user_name || meta?.user_name || "";
        const profileAvatarColor =
          data?.avatar_color || meta?.avatar_color || AVATAR_COLORS[0].value;

        setUserName(profileUserName);
        setAvatarColor(profileAvatarColor);
      } catch (err) {
        setError(formatErrorMessage(err) || "프로필 불러오기 실패");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [supabase, router]);

  // 프로필 업데이트
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("사용자를 찾을 수 없습니다.");

      if (!AVATAR_COLORS.some((c) => c.value === avatarColor)) {
        throw new Error("유효한 아바타 색상을 선택하세요.");
      }

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_name: userName,
          avatar_color: avatarColor,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "업데이트 실패");
      }

      alert("프로필이 업데이트 되었습니다.");
      setShowColorDropdown(false);
    } catch (err) {
      setError(formatErrorMessage(err) || "업데이트 실패");
    } finally {
      setIsSaving(false);
    }
  };

  const getAvatarColorLabel = (color: string) => {
    return AVATAR_COLORS.find((c) => c.value === color)?.label || "색상 선택";
  };

  const getAvatarColorBg = (color: string) => {
    return AVATAR_COLORS.find((c) => c.value === color)?.bg || "transparent";
  };

  if (isLoading) {
    return <div className="text-center">로딩 중...</div>;
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-zinc-900">정보 수정</CardTitle>
          <CardDescription className="text-zinc-500">프로필 정보를 수정합니다.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleUpdateProfile}>
            <div className="flex flex-col gap-6">
              {/* 닉네임 입력 */}
              <div className="grid gap-2">
                <Label htmlFor="username" className="text-zinc-900">
                  닉네임
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="기존 정보"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-400"
                  required
                />
              </div>

              {/* 아바타 색상 선택 */}
              <div className="grid gap-2">
                <Label htmlFor="avatar-color" className="text-zinc-900">
                  아바타 색상
                </Label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setShowColorDropdown(!showColorDropdown)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded"
                          style={{ backgroundColor: getAvatarColorBg(avatarColor) }}
                        />
                        {getAvatarColorLabel(avatarColor) || "기존 정보"}
                      </span>
                      <span>▼</span>
                    </div>
                  </button>

                  {/* 드롭다운 메뉴 */}
                  {showColorDropdown && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-input bg-background p-2 shadow-md">
                      {AVATAR_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className="w-full rounded px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => {
                            setAvatarColor(color.value);
                            setShowColorDropdown(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <div
                                className="h-4 w-4 rounded"
                                style={{ backgroundColor: color.bg }}
                              />
                              {color.label}
                            </span>
                            {avatarColor === color.value && <span>✓</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "저장 중..." : "확인"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
