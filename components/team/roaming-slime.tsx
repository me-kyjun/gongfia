"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { getSlimeImage } from "@/lib/utils";

// 컬러값을 슬라임 이미지 경로로 매핑해주는 헬퍼 함수

interface RoamingSlimeProps {
  userName: string;
  avatarColor: string;
  avatarFace?: number; // 추가
}

export function RoamingSlime({ userName, avatarColor, avatarFace = 1 }: RoamingSlimeProps) {
  const imageSrc = getSlimeImage(avatarColor, avatarFace);

  // 배경 폭이 200vw이므로, 화면 밖으로 나가는 것을 막기 위해 5vw ~ 195vw 사이로 한정
  const [positionX, setPositionX] = useState(() => 5 + Math.random() * 190);
  const [isFlipped, setIsFlipped] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const waitTime = duration + 1000 + Math.random() * 3000;

    const timer = setTimeout(() => {
      const moveDistance = 10 + Math.random() * 30;
      const direction = Math.random() > 0.5 ? 1 : -1;

      let newX = positionX + direction * moveDistance;

      if (newX < 5) newX = 5;
      if (newX > 195) newX = 195;

      const nextMoveDuration = 3000 + Math.random() * 4000;

      setDuration(nextMoveDuration);
      setIsFlipped(newX > positionX);
      setPositionX(newX);
    }, waitTime);

    return () => clearTimeout(timer);
  }, [positionX, duration]);

  return (
    <div
      className="pointer-events-none absolute z-[12] flex flex-col items-center"
      style={{
        left: `${positionX}vw`,
        bottom: "13%", // 화면 아래에서 13% 위치로 수정
        transform: "translateX(-50%)",
        transition: `left ${duration}ms linear`,
      }}
    >
      <span className="mb-2 text-base font-bold text-white drop-shadow-md">{userName}</span>

      <div className="relative flex h-48 w-48 items-center justify-center font-bold text-white drop-shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt="Roaming Slime"
          className={cn(
            "absolute inset-0 h-full w-full object-contain transition-transform duration-300 [image-rendering:pixelated]",
            isFlipped ? "scale-x-[-1]" : "",
          )}
        />
      </div>
    </div>
  );
}
