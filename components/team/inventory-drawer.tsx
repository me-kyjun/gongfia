"use client";

import { ITEM_IMAGES, SCALE_FACTOR } from "./lobby-constants";
import { ExtendedShopItem, OwnedItem } from "./types";

interface InventoryDrawerProps {
  isEditMode: boolean;
  ownedItems: OwnedItem[];
  imageSizes: Record<string, { w: number; h: number }>;
  onImageLoad: (name: string, w: number, h: number) => void;
  onDragStart: (
    e: React.DragEvent,
    shopItemId: string,
    itemName: string,
    placingType: string,
  ) => void;
  onDragEnd: () => void;
  onTouchStart: (shopItemId: string, itemName: string, placingType: string) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function InventoryDrawer({
  isEditMode,
  ownedItems,
  imageSizes,
  onImageLoad,
  onDragStart,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: InventoryDrawerProps) {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-30 flex h-48 flex-col border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-md transition-transform duration-500 ease-in-out ${isEditMode ? "translate-y-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]" : "translate-y-full"}`}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-8 py-3">
        <span className="font-bold tracking-wide text-white">보유 가구 목록</span>
        <span className="text-sm font-medium text-zinc-400">
          배치할 가구를 선택하여 배경으로 드래그하세요
        </span>
      </div>

      <div
        className="no-scrollbar flex-1 overflow-x-auto overflow-y-hidden px-8"
        onWheel={(e) => {
          if (e.currentTarget) e.currentTarget.scrollLeft += e.deltaY;
        }}
      >
        <div className="flex h-full w-max items-center gap-6 py-4">
          {ownedItems.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center px-10 text-zinc-500">
              미배치된 가구가 없습니다. 상점에서 구매해보세요!
            </div>
          ) : (
            ownedItems.map(({ shop_item, count }) => {
              const imageSrc = ITEM_IMAGES[shop_item.item_name] || "/shop-items/default.png";
              const placingType = (shop_item as ExtendedShopItem).placing_type || "floor";

              return (
                <div
                  key={shop_item.id}
                  draggable={true}
                  onDragStart={(e) =>
                    onDragStart(e, shop_item.id, shop_item.item_name, placingType)
                  }
                  onDragEnd={onDragEnd}
                  // 모바일 터치 이벤트 연결 (모바일 브라우저의 기본 스크롤 동작 간섭을 막기 위해 touch-none 클래스 적용)
                  onTouchStart={() => onTouchStart(shop_item.id, shop_item.item_name, placingType)}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  className="group relative flex h-full w-32 shrink-0 cursor-pointer touch-none select-none flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 transition-all hover:-translate-y-1 hover:border-zinc-500 hover:bg-zinc-800 hover:shadow-xl active:cursor-grabbing"
                >
                  <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow-md">
                    {count}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc}
                    alt={shop_item.item_name}
                    draggable={false}
                    onLoad={(e) => {
                      if (!imageSizes[shop_item.item_name]) {
                        const nw = e.currentTarget.naturalWidth * SCALE_FACTOR;
                        const nh = e.currentTarget.naturalHeight * SCALE_FACTOR;
                        onImageLoad(shop_item.item_name, nw, nh);
                      }
                    }}
                    className="pointer-events-none h-16 w-16 scale-125 object-contain drop-shadow-lg transition-transform [image-rendering:pixelated] group-hover:scale-150"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement!.innerHTML += `<span class="text-zinc-600 text-3xl">📦</span>`;
                    }}
                  />
                  <span className="pointer-events-none mt-3 text-xs font-semibold text-zinc-300 transition-colors group-hover:text-white">
                    {shop_item.item_name}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
