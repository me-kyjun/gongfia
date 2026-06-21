"use client";

interface ConnectingViewProps {
  /** 현재 접속한 참여자 수 */
  connectedCount: number;
  /** 게임에 초대된 전체 참여자 수 */
  totalCount: number;
  /** X 버튼 클릭 시 콜백 (팀 로비로 복귀) */
  onCancel: () => void;
}

/**
 * 지정된 인원이 모두 접속하기 전까지 표시되는 연결 대기 화면.
 * 스크린샷 참고: 흰 배경, 중앙 "N/M", 하단 "기다리는 중...", 하단 X 버튼.
 */
export function ConnectingView({ connectedCount, totalCount, onCancel }: ConnectingViewProps) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-white">
      {/* 중앙 — 접속 현황 */}
      <div className="flex flex-col items-center gap-3">
        <span
          className="text-7xl font-bold tracking-tight text-zinc-900 md:text-8xl"
          aria-label={`${totalCount}명 중 ${connectedCount}명 접속`}
        >
          {connectedCount}/{totalCount}
        </span>
        <span className="text-sm text-zinc-400">기다리는 중...</span>
      </div>

      {/* 하단 고정 — X 버튼 */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <button
          onClick={onCancel}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-all hover:scale-110 hover:bg-black active:scale-95"
          aria-label="게임 취소"
        >
          <span className="text-lg font-bold">✕</span>
        </button>
      </div>
    </main>
  );
}
