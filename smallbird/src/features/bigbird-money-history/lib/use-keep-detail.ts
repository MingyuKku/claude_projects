import { useState } from "react";

interface Kept<T> {
  id: string;
  record: T;
}

/**
 * 열어 둔 상세 대상을 목록이 바뀌어도 유지함. 상세 조회 API가 없어 상세는 지금 보이는 목록에서 찾는데(`found`),
 * 필터·쪽·개수를 바꾸면 대상이 새 목록에 없을 수 있음. 그래도 열어 둔 동안은 마지막으로 찾은 내용을 보임.
 * 기억은 이 훅을 쓰는 화면이 떠 있는 동안만이고, 다른 대상(`id`)으로 바뀌면 쓰지 않음.
 * 새로고침·주소로 바로 들어온 경우는 목록에서 못 찾으면 열지 않음.
 */
export function useKeepDetail<T>(id: string | null, found: T | null) {
  const [kept, setKept] = useState<Kept<T> | null>(null);

  // 렌더 중 상태 보정(React 공식 패턴): 찾은 내용이 바뀌었을 때만 기억을 갱신함.
  if (id !== null && found !== null && kept?.record !== found) {
    setKept({ id, record: found });
  }

  if (id === null) return null;
  return found ?? (kept?.id === id ? kept.record : null);
}
