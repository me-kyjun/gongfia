"use client";

import { Coins, LogOut, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type ShopItem = Database["public"]["Tables"]["shop_items"]["Row"];

const ITEM_IMAGES: Record<string, string> = {
  "책장 1": "/shop-items/bookshelf.png",
  "서랍 1": "/shop-items/drawer.png",
  "책상 1": "/shop-items/desk.png",
  "거울 1": "/shop-items/mirror.png",
  "액자 1": "/shop-items/frame.png",
  "그림 1": "/shop-items/painting.png",
  "장식 1": "/shop-items/ornament.png",
};

interface ShopViewProps {
  teamId: string;
  initialPoints: number;
  shopItems: ShopItem[];
}

export function ShopView({ teamId, initialPoints, shopItems }: ShopViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const [roomPoints, setRoomPoints] = useState(initialPoints);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const [ownedCounts, setOwnedCounts] = useState<Record<string, number>>({});
  const [itemToBuy, setItemToBuy] = useState<ShopItem | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const fetchOwnedItems = useCallback(async () => {
    const { data } = await supabase.from("team_rooms").select("item_id").eq("team_id", teamId);

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((row) => {
        counts[row.item_id] = (counts[row.item_id] || 0) + 1;
      });
      setOwnedCounts(counts);
    }
  }, [supabase, teamId]);

  useEffect(() => {
    supabase
      .from("teams")
      .select("room_points")
      .eq("id", teamId)
      .single()
      .then(({ data }) => {
        if (data?.room_points !== undefined) setRoomPoints(data.room_points);
      });
  }, [supabase, teamId]);

  useEffect(() => {
    fetchOwnedItems();

    const teamUpdateChannel = supabase
      .channel(`shop-team-update:${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "teams",
          filter: `id=eq.${teamId}`,
        },
        (payload) => {
          if (payload.new.room_points !== undefined) {
            setRoomPoints(payload.new.room_points);
          }
        },
      )
      .subscribe();

    const roomItemsChannel = supabase
      .channel(`shop-team-rooms:${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_rooms",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          fetchOwnedItems();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(teamUpdateChannel);
      supabase.removeChannel(roomItemsChannel);
    };
  }, [teamId, supabase, fetchOwnedItems]);

  const handleBuyClick = (item: ShopItem) => {
    if (roomPoints < item.price) {
      alert("포인트가 부족합니다!");
      return;
    }
    setItemToBuy(item);
  };

  const executeBuy = async () => {
    if (!itemToBuy) return;
    const currentItem = itemToBuy;
    setItemToBuy(null);
    setPurchasingId(currentItem.id);

    try {
      const res = await fetch(`/api/teams/${teamId}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: currentItem.id, price: currentItem.price }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "구매 실패");

      setRoomPoints(data.remaining_points);
      setOwnedCounts((prev) => ({
        ...prev,
        [currentItem.id]: (prev[currentItem.id] || 0) + 1,
      }));
      fetchOwnedItems();
    } catch (error: unknown) {
      alert(`구매 실패: ${(error as Error).message}`);
    } finally {
      setPurchasingId(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftState - walk;
  };
  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    if (e.deltaY !== 0) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <main className="relative flex h-screen w-full select-none flex-col overflow-hidden bg-zinc-950 duration-500 animate-in fade-in">
      <div className="pointer-events-none absolute left-1/2 top-8 z-20 flex -translate-x-1/2 flex-col items-center">
        <h1 className="text-3xl font-extrabold text-white drop-shadow-md">가구 상점</h1>
        <p className="mt-2 text-sm text-zinc-400 drop-shadow-md">
          포인트를 사용하여 팀의 공간을 꾸며보세요.
        </p>
      </div>

      <div className="absolute right-6 top-6 z-20 flex items-center gap-3">
        <div className="flex h-10 cursor-default items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white/95 px-4 font-bold text-zinc-900 shadow-lg transition-transform hover:scale-105">
          <Coins className="h-5 w-5 text-amber-500" />
          <span>{roomPoints} P</span>
        </div>
        <Button
          variant="secondary"
          className="h-10 bg-white/95 font-bold text-zinc-600 shadow-lg transition-transform hover:scale-105 hover:bg-white hover:text-zinc-950 active:scale-95"
          onClick={() => router.push(`/team/${teamId}`)}
        >
          <LogOut className="mr-2 h-4 w-4" />
          나가기
        </Button>
      </div>

      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        className="no-scrollbar absolute inset-0 z-10 flex items-center overflow-x-auto overflow-y-hidden px-16"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <div className="flex flex-nowrap items-center gap-8 pt-16">
          {shopItems.length === 0 ? (
            <div className="flex h-40 w-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-500">
              판매 중인 아이템이 없습니다.
            </div>
          ) : (
            shopItems.map((item) => {
              const imageSrc = ITEM_IMAGES[item.item_name] || "/shop-items/default.png";
              const canAfford = roomPoints >= item.price;
              const isPurchasing = purchasingId === item.id;

              const count = ownedCounts[item.id] || 0;

              return (
                <Card
                  key={item.id}
                  className="flex w-80 shrink-0 flex-col overflow-hidden border-zinc-800 bg-zinc-900 shadow-2xl transition-transform hover:-translate-y-2"
                >
                  <div className="pointer-events-none relative flex aspect-square w-full items-center justify-center overflow-hidden bg-zinc-800/50 p-6">
                    {/* scale-200에서 scale-[4.0]으로 변경하여 기존 표시 크기 대비 2배 확대 */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc}
                      alt={item.item_name}
                      className="max-h-full max-w-full scale-[2.5] object-contain drop-shadow-2xl [image-rendering:pixelated]"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement?.classList.add("bg-zinc-800");
                        e.currentTarget.parentElement!.innerHTML = `<span class="text-zinc-600 text-6xl">📦</span>`;
                      }}
                    />
                  </div>

                  <CardHeader className="p-5 pb-2">
                    <CardTitle className="text-xl font-bold text-white">{item.item_name}</CardTitle>
                    <p className="mt-1 text-sm font-semibold text-emerald-400">
                      보유 수량: {count}개
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1 p-5 pt-0">
                    <div className="mt-2 flex items-center text-lg font-bold text-amber-500">
                      <Coins className="mr-1.5 h-5 w-5" />
                      {item.price} P
                    </div>
                  </CardContent>

                  <CardFooter className="p-5 pt-0">
                    <Button
                      onClick={() => handleBuyClick(item)}
                      disabled={!canAfford || isPurchasing}
                      className={`w-full font-bold transition-all ${
                        canAfford
                          ? "bg-white text-zinc-950 hover:bg-zinc-200"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {isPurchasing ? (
                        "결제 중..."
                      ) : canAfford ? (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" /> 구매하기
                        </>
                      ) : (
                        "포인트 부족"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {itemToBuy && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-300 animate-in fade-in">
          <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900 shadow-2xl duration-300 animate-in zoom-in-95">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">구매 확인</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-zinc-300">
                <span className="font-bold text-amber-400">[{itemToBuy.item_name}]</span> 아이템을{" "}
                <span className="font-bold text-amber-500">{itemToBuy.price}P</span>에
                구매하시겠습니까?
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 border-t border-zinc-800 pt-5">
              <Button
                variant="ghost"
                onClick={() => setItemToBuy(null)}
                className="text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                취소
              </Button>
              <Button
                onClick={executeBuy}
                className="bg-white font-bold text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                구매하기
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </main>
  );
}
