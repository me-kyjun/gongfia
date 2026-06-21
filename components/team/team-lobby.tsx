"use client";

import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { type GameSettings, GameSetupView } from "./game-setup-view";
import { InventoryDrawer } from "./inventory-drawer";
import { InviteMemberModal } from "./invite-member-modal";
import {
  BG_FLOOR_HEIGHT,
  BG_WALL_HEIGHT,
  FLOOR_Y_POS,
  GRID_SIZE,
  ITEM_IMAGES,
  SCALE_FACTOR,
  WALL_Y_POS,
} from "./lobby-constants";
import { LobbyHeader } from "./lobby-header";
import { LobbyAlertModal, LobbyConfirmModal } from "./lobby-modals";
import { MemberCard } from "./member-card";
import { PlacedItem } from "./placed-item";
import { RoamingSlime } from "./roaming-slime";
import {
  ExtendedShopItem,
  ExtendedTeam,
  Member,
  OwnedItem,
  PlacedItemData,
  PresenceState,
  RoomRow,
  TeamWithMembers,
} from "./types";

interface TeamLobbyProps {
  initialTeam: TeamWithMembers;
  currentUserId: string;
  isOwner: boolean;
}

export function TeamLobby({ initialTeam, currentUserId, isOwner }: TeamLobbyProps) {
  const router = useRouter();
  const supabase = createClient();
  const teamId = initialTeam.id;

  const [showSetupView, setShowSetupView] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [activePlacedItemId, setActivePlacedItemId] = useState<string | null>(null);

  const isLeavingRef = useRef(false);

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, message: "" });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    targetUserId: string | null;
    actionType: "kick" | "leave" | null;
  }>({ isOpen: false, message: "", targetUserId: null, actionType: null });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDraggingBg, setIsDraggingBg] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [pendingGameId, setPendingGameId] = useState<string | null>(null);
  const [roomPoints, setRoomPoints] = useState<number>(initialTeam.room_points ?? 0);

  const [ownedItems, setOwnedItems] = useState<OwnedItem[]>([]);
  const [placedItems, setPlacedItems] = useState<PlacedItemData[]>([]);

  const [imageSizes, setImageSizes] = useState<Record<string, { w: number; h: number }>>({});

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedItemName, setDraggedItemName] = useState<string | null>(null);
  const [draggedItemPlacingType, setDraggedItemPlacingType] = useState<string>("floor");
  const [previewX, setPreviewX] = useState<number | null>(null);

  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  const [members, setMembers] = useState<Member[]>(initialTeam.team_members ?? []);

  useEffect(() => {
    setMembers(initialTeam.team_members ?? []);
  }, [initialTeam.team_members]);

  const handleImageLoad = useCallback((name: string, w: number, h: number) => {
    setImageSizes((prev) => ({ ...prev, [name]: { w, h } }));
  }, []);

  const fetchOwnedItems = useCallback(async () => {
    const { data, error } = await supabase
      .from("team_rooms")
      .select(`id, item_id, placed_at, shop_items (*)`)
      .eq("team_id", teamId);

    if (error) return;

    if (data) {
      const itemMap = new Map<string, OwnedItem>();
      const placed: PlacedItemData[] = [];

      (data as unknown as RoomRow[]).forEach((row) => {
        const shopItem = Array.isArray(row.shop_items) ? row.shop_items[0] : row.shop_items;
        if (!shopItem) return;

        if (row.placed_at !== null) {
          placed.push({
            id: row.id,
            item_id: row.item_id,
            shop_item: shopItem,
            placed_x: Number(row.placed_at),
          });
        } else {
          if (itemMap.has(shopItem.id)) {
            itemMap.get(shopItem.id)!.count++;
          } else {
            itemMap.set(shopItem.id, { shop_item: shopItem, count: 1 });
          }
        }
      });
      setOwnedItems(Array.from(itemMap.values()));
      setPlacedItems(placed);
    }
  }, [supabase, teamId]);

  const fetchLatestMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from("team_members")
      .select("*, profiles(id, user_name, avatar_color, avatar_face)")
      .eq("team_id", teamId);

    if (!error && data) {
      setMembers(data as Member[]);
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
    fetchLatestMembers();

    const presenceChannel = supabase.channel(`team-lobby:${teamId}`);
    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState<PresenceState>();
        const ids = new Set<string>();
        Object.values(state).forEach((presences) => {
          presences.forEach((p) => ids.add(p.user_id));
        });
        setOnlineUserIds(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await presenceChannel.track({ user_id: currentUserId });
      });

    const gameChannel = supabase
      .channel(`game-start:${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_participants",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => setPendingGameId(payload.new.game_id as string),
      )
      .subscribe();

    const membersChannel = supabase
      .channel(`team-members:${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_members",
          filter: `team_id=eq.${teamId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, user_name, avatar_color, avatar_face")
            .eq("id", payload.new.user_id)
            .single();

          if (!profile) return;

          setMembers((prev) => {
            if (prev.some((m) => m.user_id === payload.new.user_id)) return prev;

            const newMember = {
              team_id: payload.new.team_id,
              user_id: payload.new.user_id,
              role: payload.new.role ?? "member",
              joined_at: payload.new.joined_at ?? null,
              profiles: profile as unknown as Member["profiles"],
            } as Member;

            return [...prev, newMember];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "team_members",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          setMembers((prev) => prev.filter((m) => m.user_id !== payload.old.user_id));
          if (payload.old.user_id === currentUserId && !isLeavingRef.current) {
            setAlertModal({
              isOpen: true,
              message: "방장에 의해 팀에서 제외되었습니다.",
              onConfirm: () => router.replace("/home"),
            });
          }
        },
      )
      .subscribe();

    const teamUpdateChannel = supabase
      .channel(`team-update:${teamId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "teams", filter: `id=eq.${teamId}` },
        (payload) => {
          if (payload.new.room_points !== undefined) setRoomPoints(payload.new.room_points);
        },
      )
      .subscribe();

    const roomItemsChannel = supabase
      .channel(`lobby-team-rooms:${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_rooms", filter: `team_id=eq.${teamId}` },
        () => fetchOwnedItems(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(teamUpdateChannel);
      supabase.removeChannel(roomItemsChannel);
    };
  }, [teamId, currentUserId, router, supabase, fetchOwnedItems, fetchLatestMembers]);

  const handleBgMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current || isEditMode) return;
    setIsDraggingBg(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const handleBgMouseLeave = () => setIsDraggingBg(false);
  const handleBgMouseUp = () => setIsDraggingBg(false);
  const handleBgMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingBg || !scrollRef.current || isEditMode) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleLobbyPlayClick = () => {
    if (!isOwner) {
      if (pendingGameId) {
        router.push(`/game/${pendingGameId}`);
        setPendingGameId(null);
      } else {
        setAlertModal({ isOpen: true, message: "방장이 게임을 시작할 때까지 기다려주세요." });
      }
      return;
    }
    setShowSetupView(true);
  };

  const handleMemberAction = (targetUserId: string, actionType: "kick" | "leave") => {
    setConfirmModal({
      isOpen: true,
      message:
        actionType === "kick" ? "해당 멤버를 추방하시겠습니까?" : "정말 팀을 탈퇴하시겠습니까?",
      targetUserId,
      actionType,
    });
  };

  const executeMemberAction = async () => {
    const { targetUserId, actionType } = confirmModal;
    if (!targetUserId || !actionType) return;
    if (actionType === "leave") isLeavingRef.current = true;

    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "요청 실패");
      setActiveMemberId(null);
      if (actionType === "leave") router.replace("/home");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
      setAlertModal({ isOpen: true, message: `실패: ${errorMessage}` });
      if (actionType === "leave") isLeavingRef.current = false;
    } finally {
      setConfirmModal({ isOpen: false, message: "", targetUserId: null, actionType: null });
    }
  };

  const handleStoreItem = async (roomId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/rooms`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "store", roomId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "수납 중 서버 에러");
      }

      setActivePlacedItemId(null);
      fetchOwnedItems();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
      setAlertModal({ isOpen: true, message: errorMessage });
    }
  };

  // DB에 아이템을 배치하는 공통 함수 추출 (마우스와 터치 이벤트에서 모두 재사용)
  const executeDrop = async (
    snappedX: number,
    shopItemId: string,
    dropItemName: string | null,
    dropItemType: string,
  ) => {
    const dropItemWidth = dropItemName
      ? (imageSizes[dropItemName]?.w ?? 48 * SCALE_FACTOR)
      : 48 * SCALE_FACTOR;

    const isColliding = placedItems.some((item) => {
      const itemType = (item.shop_item as ExtendedShopItem).placing_type || "floor";
      const isYOverlapping = itemType === dropItemType;

      const placedItemWidth = imageSizes[item.shop_item.item_name]?.w ?? 48 * SCALE_FACTOR;
      const minDistance = (dropItemWidth + placedItemWidth) / 2;

      const isXOverlapping = Math.abs(item.placed_x - snappedX) < minDistance;
      return isYOverlapping && isXOverlapping;
    });

    if (isColliding) {
      setAlertModal({
        isOpen: true,
        message: "다른 가구와 영역이 겹칩니다. 빈 공간에 배치해주세요.",
      });
      return;
    }

    try {
      const res = await fetch(`/api/teams/${teamId}/rooms`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "place", shopItemId, placedX: snappedX }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "배치 중 서버 에러");
      }

      fetchOwnedItems();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
      setAlertModal({ isOpen: true, message: errorMessage });
    }
  };

  const handleItemDragStart = (
    e: React.DragEvent,
    shopItemId: string,
    itemName: string,
    placingType: string,
  ) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", shopItemId);
    setDraggedItemId(shopItemId);
    setDraggedItemName(itemName);
    setDraggedItemPlacingType(placingType || "floor");
  };

  const handleItemDragEnd = () => {
    setDraggedItemId(null);
    setDraggedItemName(null);
    setDraggedItemPlacingType("floor");
    setPreviewX(null);
  };

  const handleBgDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isEditMode || !scrollRef.current) return;
    const containerRect = scrollRef.current.getBoundingClientRect();
    const absoluteX = e.clientX - containerRect.left + scrollRef.current.scrollLeft;
    const snappedX = Math.round(absoluteX / GRID_SIZE) * GRID_SIZE;
    setPreviewX(snappedX);
  };

  const handleBgDragLeave = () => setPreviewX(null);

  const handleBgDrop = async (e: React.DragEvent) => {
    e.preventDefault();

    if (!isEditMode) return;

    const shopItemId = draggedItemId || e.dataTransfer.getData("text/plain");
    const dropItemName = draggedItemName;
    const dropItemType = draggedItemPlacingType;

    setDraggedItemId(null);
    setDraggedItemName(null);
    setDraggedItemPlacingType("floor");
    setPreviewX(null);

    if (!shopItemId || !scrollRef.current) return;

    const containerRect = scrollRef.current.getBoundingClientRect();
    const absoluteX = e.clientX - containerRect.left + scrollRef.current.scrollLeft;
    const snappedX = Math.round(absoluteX / GRID_SIZE) * GRID_SIZE;

    await executeDrop(snappedX, shopItemId, dropItemName, dropItemType);
  };

  // 모바일 환경 터치 드래그 구현
  const handleTouchStart = (shopItemId: string, itemName: string, placingType: string) => {
    if (!isEditMode) return;
    setDraggedItemId(shopItemId);
    setDraggedItemName(itemName);
    setDraggedItemPlacingType(placingType || "floor");
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isEditMode || !draggedItemId || !scrollRef.current) return;
    const touch = e.touches[0];
    const containerRect = scrollRef.current.getBoundingClientRect();

    const absoluteX = touch.clientX - containerRect.left + scrollRef.current.scrollLeft;
    const snappedX = Math.round(absoluteX / GRID_SIZE) * GRID_SIZE;
    setPreviewX(snappedX);
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (!isEditMode || !draggedItemId) return;

    const shopItemId = draggedItemId;
    const dropItemName = draggedItemName;
    const dropItemType = draggedItemPlacingType;
    const snappedX = previewX;

    setDraggedItemId(null);
    setDraggedItemName(null);
    setDraggedItemPlacingType("floor");
    setPreviewX(null);

    // 모바일에서 인벤토리 내부를 터치하고 뗀 게 아니라 실제로 위로 끌어올린 경우에만 배치
    const touch = e.changedTouches[0];
    // h-48(192px)이 인벤토리의 높이이므로, 화면 하단에서 192px 위쪽으로 손가락이 벗어났을 때만 드롭 인정
    const isOutsideInventory = touch.clientY < window.innerHeight - 192;

    if (snappedX !== null && isOutsideInventory) {
      await executeDrop(snappedX, shopItemId, dropItemName, dropItemType);
    }
  };

  const handleStartGame = async (settings: GameSettings) => {
    setIsStarting(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: teamId,
          duration_minutes: settings.durationMinutes,
          team_life: settings.teamLife,
          rest_interval: settings.restInterval,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "게임 세션 생성 실패");

      const sessionData = await res.json();
      const participantsRes = await fetch(`/api/games/${sessionData.session.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_ids: settings.selectedMemberIds }),
      });
      if (!participantsRes.ok)
        throw new Error((await participantsRes.json()).error || "참여자 등록 실패");

      setShowSetupView(false);
      setIsStarting(false);
      router.push(`/game/${sessionData.session.id}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
      setAlertModal({ isOpen: true, message: `게임 시작 실패: ${errorMessage}` });
      setIsStarting(false);
    }
  };

  const closeAlert = useCallback(() => {
    const onConfirm = alertModal.onConfirm;
    setAlertModal({ isOpen: false, message: "" });
    if (onConfirm) onConfirm();
  }, [alertModal]);

  return (
    <main
      className="relative flex h-screen w-full select-none flex-col overflow-hidden bg-zinc-950 duration-500 animate-in fade-in"
      onClick={() => {
        setActiveMemberId(null);
        setActivePlacedItemId(null);
      }}
    >
      {pendingGameId && !isOwner && (
        <div className="absolute inset-x-0 top-0 z-50 flex items-center justify-center bg-emerald-500 px-6 py-3 shadow-lg">
          <span className="font-semibold text-white">
            게임이 시작되었습니다! 하단 버튼을 눌러 참여하세요.
          </span>
        </div>
      )}

      <div
        ref={scrollRef}
        onMouseDown={handleBgMouseDown}
        onMouseLeave={handleBgMouseLeave}
        onMouseUp={handleBgMouseUp}
        onMouseMove={handleBgMouseMove}
        onDragOver={handleBgDragOver}
        onDragEnter={(e) => e.preventDefault()}
        onDragLeave={handleBgDragLeave}
        onDrop={handleBgDrop}
        className={`no-scrollbar absolute inset-0 z-0 overflow-y-hidden ${isEditMode ? "overflow-x-hidden" : "overflow-x-auto"}`}
        style={{ cursor: isEditMode ? "default" : isDraggingBg ? "grabbing" : "grab" }}
      >
        <div className="pointer-events-none absolute inset-0 flex h-full w-[200vw] flex-col transition-colors duration-500">
          <div
            className="w-full"
            style={{
              height: BG_WALL_HEIGHT,
              backgroundImage: "url('/others/wall1.png')",
              backgroundSize: "cover",
              backgroundPosition: "bottom center",
              backgroundRepeat: "no-repeat",
              imageRendering: "pixelated",
            }}
          />
          <div
            className="w-full"
            style={{
              height: BG_FLOOR_HEIGHT,
              backgroundImage: "url('/others/floor1.png')",
              backgroundSize: "cover",
              backgroundPosition: "top center",
              backgroundRepeat: "no-repeat",
              imageRendering: "pixelated",
            }}
          />
        </div>

        {members
          .filter((member) => onlineUserIds.has(member.user_id))
          .map((member) => {
            const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
            const userName = profile?.user_name ?? "알 수 없음";
            const avatarColor = profile?.avatar_color ?? "#6366f1";
            const avatarFace = profile?.avatar_face ?? 1;

            return (
              <RoamingSlime
                key={member.user_id}
                userName={userName}
                avatarColor={avatarColor}
                avatarFace={avatarFace}
              />
            );
          })}

        {placedItems.map((item) => (
          <PlacedItem
            key={item.id}
            item={item}
            isEditMode={isEditMode}
            isActive={isEditMode && activePlacedItemId === item.id}
            imageSize={imageSizes[item.shop_item.item_name]}
            onImageLoad={handleImageLoad}
            onStore={handleStoreItem}
            onClick={(id) => {
              setActivePlacedItemId(activePlacedItemId === id ? null : id);
              setActiveMemberId(null);
            }}
          />
        ))}

        {isEditMode && previewX !== null && draggedItemName && (
          <div
            className={`pointer-events-none absolute opacity-50 ${draggedItemPlacingType === "wall" ? "z-[5]" : "z-10"}`}
            style={{
              left: previewX,
              bottom: draggedItemPlacingType === "wall" ? WALL_Y_POS : FLOOR_Y_POS,
              transform: "translateX(-50%)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ITEM_IMAGES[draggedItemName] || "/shop-items/default.png"}
              alt="preview"
              style={
                imageSizes[draggedItemName]
                  ? { width: imageSizes[draggedItemName].w, height: imageSizes[draggedItemName].h }
                  : { width: `${48 * SCALE_FACTOR}px` }
              }
              className="max-w-none object-contain drop-shadow-2xl [image-rendering:pixelated]"
            />
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 z-[15] bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />

      <LobbyHeader
        teamId={teamId}
        isOwner={isOwner}
        isEditMode={isEditMode}
        roomPoints={roomPoints}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onInviteClick={() => setIsInviteModalOpen(true)}
      />

      {(() => {
        const leftMembers = members.slice(0, Math.min(members.length, 5));
        const rightMembers = members.slice(5, 10);

        const renderMemberCard = (member: Member) => {
          const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
          const userName = profile?.user_name ?? "알 수 없음";
          const avatarColor = profile?.avatar_color ?? "#6366f1";
          const avatarFace = profile?.avatar_face ?? 1;
          const isOnline = onlineUserIds.has(member.user_id);
          const memberIsOwner = initialTeam.owner_id === member.user_id;

          let actionType: "kick" | "leave" | null = null;
          if (isOwner && !memberIsOwner) actionType = "kick";
          else if (!isOwner && member.user_id === currentUserId) actionType = "leave";

          return (
            <MemberCard
              key={member.user_id}
              userId={member.user_id}
              userName={userName}
              avatarColor={avatarColor}
              avatarFace={avatarFace}
              isOnline={isOnline}
              isOwner={memberIsOwner}
              actionType={actionType}
              size="sm"
              showAction={activeMemberId === member.user_id}
              onCardClick={(e) => {
                e.stopPropagation();
                setActiveMemberId(activeMemberId === member.user_id ? null : member.user_id);
                setActivePlacedItemId(null);
              }}
              onActionClick={(e) => {
                e.stopPropagation();
                handleMemberAction(member.user_id, actionType!);
              }}
            />
          );
        };

        return (
          <>
            <div
              className={`pointer-events-none absolute bottom-10 left-1/4 z-20 -translate-x-1/2 transition-all duration-500 ease-in-out ${isEditMode ? "pointer-events-none translate-y-32 opacity-0" : "translate-y-0 opacity-100"}`}
            >
              <div className="pointer-events-auto flex items-end gap-5">
                {leftMembers.map(renderMemberCard)}
              </div>
            </div>

            <div
              className={`pointer-events-none absolute bottom-10 left-3/4 z-20 -translate-x-1/2 transition-all duration-500 ease-in-out ${isEditMode ? "pointer-events-none translate-y-32 opacity-0" : "translate-y-0 opacity-100"}`}
            >
              <div className="pointer-events-auto flex items-end gap-5">
                {rightMembers.map(renderMemberCard)}
              </div>
            </div>
          </>
        );
      })()}

      <div
        className={`pointer-events-auto absolute bottom-10 left-1/2 z-20 -translate-x-1/2 transition-all duration-500 ease-in-out ${isEditMode ? "pointer-events-none translate-y-32 opacity-0" : "translate-y-0 opacity-100"}`}
      >
        <button
          onClick={handleLobbyPlayClick}
          disabled={isStarting}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-zinc-950 shadow-2xl transition-all hover:scale-110 hover:bg-zinc-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 md:h-[120px] md:w-[120px]"
          aria-label="게임 시작"
        >
          <Play className="ml-1 h-12 w-12 md:h-[60px] md:w-[60px]" fill="currentColor" />
        </button>
      </div>

      <InventoryDrawer
        isEditMode={isEditMode}
        ownedItems={ownedItems}
        imageSizes={imageSizes}
        onImageLoad={handleImageLoad}
        onDragStart={handleItemDragStart}
        onDragEnd={handleItemDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      <LobbyConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        actionType={confirmModal.actionType}
        onConfirm={executeMemberAction}
        onCancel={() =>
          setConfirmModal({ isOpen: false, message: "", targetUserId: null, actionType: null })
        }
      />

      <LobbyAlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        onConfirm={closeAlert}
      />

      {showSetupView && isOwner && (
        <GameSetupView
          teamId={teamId}
          teamMembers={members}
          currentUserId={currentUserId}
          onlineUserIds={onlineUserIds}
          onStart={handleStartGame}
          onCancel={() => setShowSetupView(false)}
          isStarting={isStarting}
        />
      )}

      {isOwner && (
        <InviteMemberModal
          teamId={teamId}
          currentUserId={currentUserId}
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          currentMemberCount={members.length}
          maxCapacity={
            (initialTeam as ExtendedTeam).max_capacity ??
            (initialTeam as ExtendedTeam).max_members ??
            10
          }
        />
      )}
    </main>
  );
}
