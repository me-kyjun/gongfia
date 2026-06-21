import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";

async function AuthRedirect() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/home");
  return null;
}

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <Suspense>
        <AuthRedirect />
      </Suspense>
      {/* 배경 그라디언트 (밝은 회색 계열 — UI참고.png 스타일) */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, #e8e8e8 0%, #d0d0d0 50%, #b8b8b8 100%)",
        }}
      />

      {/* 배경 패턴 (픽셀 격자) */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* 콘텐츠 컨테이너 */}
      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-10 px-4">
        {/* GongFia 타이틀 */}
        <div className="flex flex-col items-center gap-2">
          <h1
            className="select-none text-center text-7xl font-bold tracking-wider text-zinc-900"
            style={{
              fontFamily: "var(--font-pixelify-sans)",
              textShadow: "3px 3px 0px rgba(0,0,0,0.2)",
              letterSpacing: "0.08em",
            }}
          >
            GongFia
          </h1>
          <p
            className="text-sm font-semibold tracking-widest text-zinc-500"
            style={{ fontFamily: "var(--font-pixelify-sans)" }}
          >
            STUDY EDITION
          </p>
        </div>

        {/* 버튼 그룹 */}
        <div className="flex w-full flex-col gap-3">
          <Link
            href="/auth/login"
            className="w-full border-2 border-b-4 border-zinc-400 border-b-zinc-600 bg-gradient-to-b from-zinc-200 to-zinc-300 px-8 py-4 text-center text-lg font-bold text-zinc-800 transition-all hover:from-zinc-100 hover:to-zinc-200 active:translate-y-0.5 active:border-b-2"
            style={{
              fontFamily: "var(--font-pixelify-sans)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.15)",
            }}
          >
            로그인
          </Link>

          <Link
            href="/auth/sign-up"
            className="w-full border-2 border-b-4 border-zinc-400 border-b-zinc-600 bg-gradient-to-b from-zinc-200 to-zinc-300 px-8 py-4 text-center text-lg font-bold text-zinc-800 transition-all hover:from-zinc-100 hover:to-zinc-200 active:translate-y-0.5 active:border-b-2"
            style={{
              fontFamily: "var(--font-pixelify-sans)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.15)",
            }}
          >
            회원가입
          </Link>
        </div>
      </div>

      {/* 하단 저작권 */}
      <div
        className="absolute bottom-4 left-4 text-xs text-zinc-500"
        style={{ fontFamily: "var(--font-pixelify-sans)" }}
      >
        © GongFia
      </div>
    </main>
  );
}
