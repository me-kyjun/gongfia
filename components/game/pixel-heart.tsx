"use client";

interface PixelHeartProps {
  /** true: 채워진 빨간 하트, false: 소진된 어두운 하트 */
  filled: boolean;
  /** 픽셀 단위 크기 (1 픽셀 = size px). 기본 8 */
  size?: number;
}

/**
 * 픽셀아트 스타일 하트 컴포넌트.
 * CSS box-shadow 기법으로 8x8 픽셀 그리드를 표현합니다.
 */
export function PixelHeart({ filled, size = 8 }: PixelHeartProps) {
  const color = filled ? "#c0392b" : "#4a4a4a";
  const darkColor = filled ? "#7b1a1a" : "#2e2e2e";

  // 8x8 픽셀 하트 모양 (1-indexed, x,y 좌표)
  // 픽셀 그리드: col(x) row(y), box-shadow offset = (col-1)*size, (row-1)*size
  const pixels: Array<{ x: number; y: number; dark?: boolean }> = [
    // 1행
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 5, y: 1 },
    { x: 6, y: 1 },
    // 2행
    { x: 1, y: 2 },
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 4, y: 2 },
    { x: 5, y: 2 },
    { x: 6, y: 2 },
    { x: 7, y: 2 },
    // 3행 (하이라이트)
    { x: 1, y: 3 },
    { x: 2, y: 3, dark: false },
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    { x: 5, y: 3 },
    { x: 6, y: 3 },
    { x: 7, y: 3 },
    // 4행
    { x: 1, y: 4 },
    { x: 2, y: 4 },
    { x: 3, y: 4 },
    { x: 4, y: 4 },
    { x: 5, y: 4 },
    { x: 6, y: 4 },
    { x: 7, y: 4 },
    // 5행
    { x: 2, y: 5 },
    { x: 3, y: 5 },
    { x: 4, y: 5 },
    { x: 5, y: 5 },
    { x: 6, y: 5 },
    // 6행
    { x: 3, y: 6 },
    { x: 4, y: 6 },
    { x: 5, y: 6 },
    // 7행
    { x: 4, y: 7 },
  ];

  const darkPixels = new Set(["2,1", "1,2"]);

  const shadows = pixels
    .map(({ x, y }) => {
      const isDark = darkPixels.has(`${x},${y}`);
      const c = isDark ? darkColor : color;
      return `${(x - 1) * size}px ${(y - 1) * size}px 0 ${c}`;
    })
    .join(", ");

  // 그리드는 x=1~7, y=1~7 → 실제 하트 영역 = 7*size × 7*size
  // box-shadow가 div 밖으로 나가지 않도록 wrapper를 실제 크기로 잡고,
  // 기준 픽셀(1×1)은 좌상단 모서리에 숨깁니다.
  const gridSize = 7 * size;

  return (
    <div style={{ width: gridSize, height: gridSize, position: "relative" }} aria-hidden="true">
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: size,
          height: size,
          boxShadow: shadows,
        }}
      />
    </div>
  );
}
