"use client";

import { ArrowLeft, Check, Coins, RefreshCcw, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { getSlimeImage } from "@/lib/utils";

interface PersonalShopItem {
  id: number;
  name: string;
  price: number;
  face_value: number;
}

export default function PersonalShopPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [personalPoints, setPersonalPoints] = useState(0);
  const [avatarColor, setAvatarColor] = useState("blue");
  const [currentFace, setCurrentFace] = useState(1);

  const [shopItems, setShopItems] = useState<PersonalShopItem[]>([]);
  const [purchasedFaces, setPurchasedFaces] = useState<number[]>([1]);

  const [loading, setLoading] = useState(true);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: "" });

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/auth/login");
        return;
      }
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("personal_points, avatar_color, avatar_face")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setPersonalPoints(profile.personal_points ?? 0);
        setAvatarColor(profile.avatar_color ?? "blue");
        setCurrentFace(profile.avatar_face ?? 1);
      }

      const { data: items } = await supabase
        .from("personal_shop_items")
        .select("*")
        .order("face_value", { ascending: true });

      if (items) {
        setShopItems(items as PersonalShopItem[]);
      }

      const savedPurchases = localStorage.getItem(`purchases_${session.user.id}`);
      if (savedPurchases) {
        setPurchasedFaces(JSON.parse(savedPurchases));
      }

      setLoading(false);
    };

    fetchData();
  }, [router, supabase]);

  const handleAction = async (item: PersonalShopItem) => {
    if (!userId) return;

    const isPurchased = purchasedFaces.includes(item.face_value);

    if (isPurchased) {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_face: item.face_value })
        .eq("id", userId);

      if (error) {
        setAlertModal({ isOpen: true, message: "적용 중 오류가 발생했습니다." });
      } else {
        setCurrentFace(item.face_value);
        setAlertModal({ isOpen: true, message: "표정이 적용되었습니다!" });
        router.refresh();
      }
    } else {
      if (personalPoints < item.price) {
        setAlertModal({ isOpen: true, message: "개인 포인트가 부족합니다." });
        return;
      }

      const newPoints = personalPoints - item.price;
      const { error } = await supabase
        .from("profiles")
        .update({ personal_points: newPoints })
        .eq("id", userId);

      if (error) {
        setAlertModal({ isOpen: true, message: "구매 중 오류가 발생했습니다." });
        return;
      }

      setPersonalPoints(newPoints);
      const newPurchases = [...purchasedFaces, item.face_value];
      setPurchasedFaces(newPurchases);
      localStorage.setItem(`purchases_${userId}`, JSON.stringify(newPurchases));

      setAlertModal({ isOpen: true, message: "구매를 완료했습니다! 적용 버튼을 눌러보세요." });
      router.refresh();
    }
  };

  const handleResetFace = async () => {
    if (!userId) return;
    const { error } = await supabase.from("profiles").update({ avatar_face: 1 }).eq("id", userId);

    if (error) {
      setAlertModal({ isOpen: true, message: "기본 표정으로 변경 중 오류가 발생했습니다." });
    } else {
      setCurrentFace(1);
      setAlertModal({ isOpen: true, message: "기본 표정으로 복구되었습니다!" });
      router.refresh();
    }
  };

  if (loading)
    return <div className="flex h-screen items-center justify-center bg-zinc-50">로딩 중...</div>;

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900 duration-500 animate-in fade-in">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/home")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="h-5 w-5 text-zinc-600" />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">개인 상점</h1>
              <p className="mt-1 text-sm text-zinc-500">
                슬라임 아바타의 표정을 구매하고 적용해보세요!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 shadow-sm">
            <Coins className="h-5 w-5 text-amber-500" />
            <span className="text-xl font-bold tracking-tight text-zinc-800">
              {personalPoints} <span className="text-base text-zinc-500">P</span>
            </span>
          </div>
        </div>

        <div className="mb-12 flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <span className="mb-4 text-sm font-semibold text-zinc-500">현재 내 아바타</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getSlimeImage(avatarColor, currentFace)}
            alt="My Slime"
            className="h-32 w-32 object-contain drop-shadow-xl [image-rendering:pixelated]"
          />

          {currentFace !== 1 && (
            <Button
              onClick={handleResetFace}
              className="mt-6 flex items-center gap-2 bg-zinc-900 font-bold text-white transition-colors hover:bg-zinc-800"
            >
              <RefreshCcw className="h-4 w-4" />
              기본 표정으로 변경
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {shopItems.map((item) => {
            const isPurchased = purchasedFaces.includes(item.face_value);
            const isEquipped = currentFace === item.face_value;

            return (
              <Card
                key={item.id}
                className="group relative overflow-hidden border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <CardHeader className="p-4 text-center">
                  <CardTitle className="text-base text-zinc-700">{item.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getSlimeImage(avatarColor, item.face_value)}
                    alt={item.name}
                    draggable={false}
                    className="h-28 w-28 object-contain drop-shadow-lg transition-transform [image-rendering:pixelated] group-hover:scale-110"
                  />
                </CardContent>
                <CardFooter className="flex flex-col gap-3 p-4">
                  {!isPurchased && (
                    <div className="flex items-center gap-1.5 font-bold text-amber-600">
                      <Coins className="h-4 w-4" /> {item.price} P
                    </div>
                  )}
                  <Button
                    onClick={() => handleAction(item)}
                    disabled={isEquipped}
                    variant={isPurchased ? (isEquipped ? "outline" : "default") : "default"}
                    className={`w-full font-bold ${isEquipped ? "border-zinc-200 bg-zinc-100 text-zinc-400" : "bg-zinc-900 text-white hover:bg-zinc-800"}`}
                  >
                    {isEquipped ? (
                      <>
                        <Check className="mr-2 h-4 w-4" /> 적용됨
                      </>
                    ) : isPurchased ? (
                      "적용하기"
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" /> 구매하기
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {alertModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm border-zinc-200 bg-white shadow-xl duration-300 animate-in zoom-in-95">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-zinc-900">알림</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-zinc-600">{alertModal.message}</p>
            </CardContent>
            <CardFooter className="flex justify-end pt-4">
              <Button
                onClick={() => setAlertModal({ isOpen: false, message: "" })}
                className="bg-zinc-900 font-bold text-white hover:bg-zinc-800"
              >
                확인
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </main>
  );
}
