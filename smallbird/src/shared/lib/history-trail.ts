import type { DataRouter } from "react-router";

// 이 탭에서 지나온 방문 기록 항목(`location.key`)의 순서와 지금 위치. 브라우저는 기록 목록을 읽게 해 주지 않아
// 라우터의 이동을 따라 적음. 새로고침하면 그 앞 기록은 알 수 없어 지금 항목부터 다시 적음.
let entries: string[] = [];
let index = -1;

function record(action: DataRouter["state"]["historyAction"], key: string) {
  if (entries[index] === key) return;
  if (action === "PUSH") {
    entries = [...entries.slice(0, index + 1), key];
    index = entries.length - 1;
    return;
  }
  if (action === "REPLACE") {
    entries[index] = key;
    return;
  }
  const found = entries.indexOf(key);
  if (found >= 0) {
    index = found;
    return;
  }
  entries = [key];
  index = 0;
}

/** 라우터를 만든 직후 호출함. 이후 이동을 따라 적어 `getStepsBackTo`가 기록 칸 수를 셀 수 있게 함. */
export function trackHistoryTrail(router: DataRouter) {
  entries = [router.state.location.key];
  index = 0;
  return router.subscribe((state) => {
    record(state.historyAction, state.location.key);
  });
}

/** 지금 기록에서 `key` 기록까지 몇 칸 뒤인지. 이 탭에서 지나온 앞쪽 기록이 아니면 null. */
export function getStepsBackTo(key: string) {
  if (index < 1) return null;
  const found = entries.lastIndexOf(key, index - 1);
  return found >= 0 ? index - found : null;
}
