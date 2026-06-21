"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ProfileForm } from "@/components/profile-form";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [supabase, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10">
        <div className="text-center text-zinc-500">로딩 중...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <button
          type="button"
          className="self-start pl-5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          onClick={() => router.push("/home")}
        >
          ← 홈으로
        </button>

        <ProfileForm />

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-zinc-900">비밀번호 변경</h2>
          </div>
          <Button className="w-full" onClick={() => router.push("/password-change")}>
            변경
          </Button>
        </div>
      </div>
    </main>
  );
}
