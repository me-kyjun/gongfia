"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <button
      onClick={logout}
      className="border border-zinc-400 bg-gradient-to-b from-zinc-200 to-zinc-300 px-3 py-1 text-xs font-bold text-zinc-700 transition-all hover:from-zinc-100 hover:to-zinc-200 active:translate-y-px"
      style={{ fontFamily: "var(--font-pixelify-sans)" }}
    >
      로그아웃
    </button>
  );
}
