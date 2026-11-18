import { createLucideIcon } from "lucide-react";

// Figma 삭제 아이콘(디자인 시스템 `Lucide Icons / trash`, Sub ID 목록 10724:186167): 뚜껑·손잡이·몸통만 있는 쓰레기통.
// 시안은 lucide의 옛 `trash`를 쓰는데, 설치된 lucide-react 1.x의 `trash`는 몸통 안에 세로줄 2개가 있는 모양(`Trash2`와 같음)으로
// 바뀌어 시안과 달라짐. 그래서 시안의 벡터(16칸 좌표)를 24칸으로 옮긴 경로를 같은 API로 정의함.
// lucide 아이콘처럼 `size-*`·색(currentColor)·선 굵기를 따라 옆의 다른 아이콘과 같게 그려짐.
export const TrashIcon = createLucideIcon("trash-outline", [
  ["path", { d: "M3 6h18", key: "lid" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "body" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "handle" }],
]);
