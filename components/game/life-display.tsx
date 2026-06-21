"use client";

interface LifeDisplayProps {
  /** 현재 남은 라이프 수 */
  teamLife: number;
}

/**
 * 팀 라이프를 녹색 원으로 표시하는 컴포넌트.
 */
export function LifeDisplay({ teamLife }: LifeDisplayProps) {
  if (teamLife <= 0) return null;

  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: teamLife }).map((_, i) => (
        <span key={i} className="h-3 w-3 rounded-full bg-green-400" aria-hidden="true" />
      ))}
    </div>
  );
}
