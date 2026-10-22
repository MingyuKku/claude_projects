import { packSiblings } from "d3-hierarchy";

export interface PackedCircle {
  x: number;
  y: number;
  r: number;
}

// d3-hierarchy 래퍼: 반지름 목록을 겹치지 않게 붙여 배치한 좌표를 돌려줌(첫 원 중심이 원점).
// 라이브러리를 교체할 때 이 파일만 고치면 됨.
export function packCircles(radii: number[]): PackedCircle[] {
  const circles = radii.map((r) => ({ r, x: 0, y: 0 }));
  packSiblings(circles);
  const origin = circles[0];
  if (!origin) return [];
  return circles.map(({ x, y, r }) => ({
    x: x - origin.x,
    y: y - origin.y,
    r,
  }));
}
