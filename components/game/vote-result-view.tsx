"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getSlimeImage } from "@/lib/utils";

interface Loser {
  id: string;
  user_name: string;
  avatar_color: string;
  avatar_face?: number;
  count: number;
}

interface VoteResultViewProps {
  losers: Loser[];
  onComplete: () => void;
}

const SINGLE_ANIM_MS = 6000;
const HOLD_AFTER_MS = 400;

interface SlimeProps {
  loser: Loser;
}

function Slime({ loser }: SlimeProps) {
  const slimeImageSrc = getSlimeImage(loser.avatar_color, loser.avatar_face ?? 1);

  return (
    <div
      className="absolute"
      style={{
        left: "15%",
        top: "42%",
        animation: `slime-fly-out ${SINGLE_ANIM_MS}ms linear forwards`,
      }}
    >
      <div className="relative flex h-24 w-24 items-center justify-center font-bold text-white drop-shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slimeImageSrc}
          alt="Slime Avatar"
          className="absolute inset-0 h-full w-full object-contain [image-rendering:pixelated]"
        />
      </div>
    </div>
  );
}

export function VoteResultView({ losers, onComplete }: VoteResultViewProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [typewriterText, setTypewriterText] = useState("");

  const completedRef = useRef(false);

  const stars = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 1,
        duration: Math.random() * 2 + 1.5,
        delay: Math.random() * 2,
        color: Math.random() > 0.85 ? "#fde68a" : "#ffffff",
      })),
    [],
  );

  const currentLoser = losers[currentIndex] ?? null;

  useEffect(() => {
    if (losers.length !== 0) return;
    const t = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current();
    }, HOLD_AFTER_MS);
    return () => clearTimeout(t);
  }, [losers.length]);

  useEffect(() => {
    if (!currentLoser) return;

    const t = setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < losers.length) {
        setCurrentIndex(nextIndex);
        setTypewriterText("");
      } else {
        const holdT = setTimeout(() => {
          if (completedRef.current) return;
          completedRef.current = true;
          onCompleteRef.current();
        }, HOLD_AFTER_MS);
        return () => clearTimeout(holdT);
      }
    }, SINGLE_ANIM_MS);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, losers.length]);

  useEffect(() => {
    if (!currentLoser) return;

    // 텍스트 변경
    const fullText = `${currentLoser.user_name}은(는) 지목당했습니다...`;

    setTypewriterText("");
    let i = 0;
    const interval = setInterval(() => {
      setTypewriterText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(interval);
    }, 80);
    return () => clearInterval(interval);
  }, [currentLoser]);

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-black">
      {stars.map((star) => (
        <div
          key={star.id}
          className="pointer-events-none absolute rounded-full"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: star.size,
            height: star.size,
            backgroundColor: star.color,
            animation: `star-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}

      {currentLoser && <Slime key={currentLoser.id} loser={currentLoser} />}

      {typewriterText && (
        <div className="absolute bottom-16 left-32 -rotate-2">
          <span className="text-3xl font-bold tracking-wide text-white drop-shadow-lg">
            {typewriterText}
          </span>
          <span
            className="ml-1 inline-block text-3xl font-bold text-white"
            style={{ animation: "cursor-blink 0.7s ease-in-out infinite" }}
          >
            |
          </span>
        </div>
      )}
    </main>
  );
}
