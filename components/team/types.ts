import { getTeamById } from "@/lib/supabase/game";
import type { Database } from "@/types/database";

export type TeamWithMembers = Awaited<ReturnType<typeof getTeamById>>;
export type Member = NonNullable<TeamWithMembers>["team_members"][number];
export type ShopItemRow = Database["public"]["Tables"]["shop_items"]["Row"];

export type ExtendedShopItem = ShopItemRow & { placing_type?: string };
export type ExtendedTeam = TeamWithMembers & { max_capacity?: number; max_members?: number };

export type RoomRow = {
  id: string;
  item_id: string;
  placed_at: number | null;
  shop_items: ShopItemRow | ShopItemRow[] | null;
};

export interface OwnedItem {
  shop_item: ShopItemRow;
  count: number;
}

export interface PlacedItemData {
  id: string;
  item_id: string;
  shop_item: ShopItemRow;
  placed_x: number;
}

export interface PresenceState {
  user_id: string;
}
