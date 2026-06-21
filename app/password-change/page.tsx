"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ChangePasswordForm } from "@/components/change-password-form";
import { createClient } from "@/lib/supabase/client";

export default function PasswordChangePage() {
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
          onClick={() => router.back()}
          className="self-start pl-5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
        >
          ← 뒤로 가기
        </button>

        <ChangePasswordForm />
      </div>
    </main>
  );
}
