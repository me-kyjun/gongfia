import { notFound, redirect } from "next/navigation";

import { ShopView } from "@/components/team/shop-view";
import { createClient } from "@/lib/supabase/server";

interface ShopPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { teamId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 상점 입장 시 현재 팀 포인트 조회
  const { data: team } = await supabase
    .from("teams")
    .select("room_points")
    .eq("id", teamId)
    .single();

  if (!team) notFound();

  // 상점에서 판매 중인 모든 아이템 리스트 조회
  const { data: shopItems } = await supabase
    .from("shop_items")
    .select("*")
    .order("price", { ascending: true });

  return <ShopView teamId={teamId} initialPoints={team.room_points} shopItems={shopItems ?? []} />;
}
