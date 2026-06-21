"use client";

import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";

import { FLOOR_Y_POS, ITEM_IMAGES, SCALE_FACTOR, WALL_Y_POS } from "./lobby-constants";
import { ExtendedShopItem, PlacedItemData } from "./types";

interface PlacedItemProps {
  item: PlacedItemData;
  isEditMode: boolean;
  isActive: boolean;
  imageSize?: { w: number; h: number };
  onImageLoad: (name: string, w: number, h: number) => void;
  onStore: (id: string) => void;
  onClick: (id: string) => void;
}

export function PlacedItem({
  item,
  isEditMode,
  isActive,
  imageSize,
  onImageLoad,
  onStore,
  onClick,
}: PlacedItemProps) {
  const itemName = item.shop_item.item_name;
  const imageSrc = ITEM_IMAGES[itemName] || "/shop-items/default.png";

  const placingType = (item.shop_item as ExtendedShopItem).placing_type || "floor";
  const bottomPos = placingType === "wall" ? WALL_Y_POS : FLOOR_Y_POS;
  const zIndexClass = isActive ? "z-20" : placingType === "wall" ? "z-[5]" : "z-10";

  return (
    <div
      className={`absolute transition-all duration-300 ${zIndexClass} ${
        isEditMode ? "pointer-events-auto cursor-pointer" : "pointer-events-none"
      }`}
      style={{ left: item.placed_x, bottom: bottomPos, transform: "translateX(-50%)" }}
      onClick={(e) => {
        if (!isEditMode) return;
        e.stopPropagation();
        onClick(item.id);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={itemName}
        draggable={false}
        onLoad={(e) => {
          if (!imageSize) {
            const nw = e.currentTarget.naturalWidth * SCALE_FACTOR;
            const nh = e.currentTarget.naturalHeight * SCALE_FACTOR;
            onImageLoad(itemName, nw, nh);
          }
        }}
        style={
          imageSize
            ? { width: imageSize.w, height: imageSize.h }
            : { width: `${48 * SCALE_FACTOR}px` }
        }
        className="max-w-none object-contain drop-shadow-2xl [image-rendering:pixelated]"
      />

      {isActive && (
        <div className="absolute inset-0 z-20 flex items-center justify-center duration-200 animate-in fade-in zoom-in-95">
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onStore(item.id);
            }}
            className="h-auto rounded-full bg-white/95 px-4 py-2 text-base font-bold text-zinc-950 shadow-2xl transition-transform hover:scale-105 hover:bg-white active:scale-95"
          >
            <Inbox size={20} className="mr-1.5 text-zinc-800" strokeWidth={2.5} /> 수납
          </Button>
        </div>
      )}
    </div>
  );
}
