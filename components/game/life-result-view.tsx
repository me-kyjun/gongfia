"use client";

import { useEffect, useState } from "react";

import { PixelHeart } from "./pixel-heart";

interface LifeResultViewProps {
  /** 최대 라이프(방 설정 값) */
  maxLife: number;
  /** 차감 후 남은 라이프 */
  currentLife: number;
  /** 애니메이션 완료 후 호출 (라이프 무손실 여부 전달) */
  onComplete: (isPerfect: boolean) => void;
}

const DEDUCT_INTERVAL_MS = 800; // 기존 속도 유지
const HOLD_AFTER_MS = 1000;
const PERFECT_HOLD_MS = 3000; // 라이프 무손실 시 3초 대기

/**
 * playing -> voting 전환 시 보여주는 하트 차감 연출
 * maxLife 개수만큼 하트를 그리고, currentLife가 될 때까지 하나씩 꺼짐
 * 연출이 끝나면 onComplete 호출
 */
export function LifeResultView({ maxLife, currentLife, onComplete }: LifeResultViewProps) {
  // 처음엔 maxLife만큼 켜진 상태로 시작
  const [displayedLife, setDisplayedLife] = useState(maxLife);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const toDeduct = maxLife - currentLife;
    if (toDeduct <= 0) {
      // 깎일 라이프가 없으면 3초 대기 후 true(만점) 전달하며 완료
      const t = setTimeout(() => onComplete(true), PERFECT_HOLD_MS);
      return () => clearTimeout(t);
    }

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setDisplayedLife(maxLife - step);
      if (step >= toDeduct) {
        clearInterval(interval);
        setDone(true);
      }
    }, DEDUCT_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!done) return;
    // 차감 연출이 끝난 경우는 false(만점 아님) 전달
    const t = setTimeout(() => onComplete(false), HOLD_AFTER_MS);
    return () => clearTimeout(t);
  }, [done, onComplete]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-16 bg-zinc-950">
      {/* ✅ 타이머 도중 라이프가 모두 깎여 조기 종료된 경우(currentLife <= 0)에만 Game Over 표시 */}
      {currentLife <= 0 && (
        <p className="text-2xl font-bold uppercase tracking-[0.3em] text-zinc-300">Game Over</p>
      )}

      <div className="flex items-center gap-14">
        {Array.from({ length: maxLife }).map((_, i) => (
          <div
            key={i}
            className="transition-opacity duration-300" // 기존 속도 유지
            style={{ opacity: i < displayedLife ? 1 : 0.2 }}
          >
            <PixelHeart filled={i < displayedLife} size={10} />
          </div>
        ))}
      </div>
    </main>
  );
}
