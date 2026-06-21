import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function getSlimeImage(color: string, face: number = 1) {
  const c = color.toLowerCase();
  let baseColor = "b";
  if (c.includes("red")) baseColor = "r";
  else if (c.includes("green")) baseColor = "g";
  else if (c.includes("yellow")) baseColor = "y";

  // 1번(기본) 표정이면 접미사 없이 반환, 2~5번이면 _f[번호] 접미사 추가
  const faceSuffix = face === 1 ? "" : `_f${face}`;
  return `/slimes/slime_${baseColor}${faceSuffix}.png`;
}
