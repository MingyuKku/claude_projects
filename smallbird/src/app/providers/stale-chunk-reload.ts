// 배포 전에 열어 둔 탭은 옛 해시의 화면 코드를 요청하는데, 새 배포에는 그 파일이 없어 화면 이동이 실패함.
// Vite가 동적 import 실패 때 내는 `vite:preloadError`로 그 에러만 표시해 두고, 라우트 에러 화면이 새로고침해 새 배포를 받음.
// 리스너에서 바로 새로고침하지 않는 이유: 이동이 끝나기 전이라 주소가 아직 이전 화면이고,
// 화면 이동과 무관한 로드 실패(언어 파일 등)에도 입력 중인 내용을 잃게 됨.
const staleChunkErrors = new WeakSet<object>();

const RELOADED_AT_KEY = "stale-chunk-reloaded-at";
// 새로고침한 뒤 이 시간 안에 또 실패하면 배포 자체의 문제로 보고 새로고침을 반복하지 않음.
const RELOAD_GUARD_MS = 10_000;

/** 동적 import 실패를 표시함. 앱 시작 때 한 번 등록함. */
export function watchStaleChunkErrors() {
  window.addEventListener("vite:preloadError", (event) => {
    staleChunkErrors.add(event.payload);
  });
}

/** 표시된 화면 코드 로드 실패이고, 직전에 같은 이유로 새로고침하지 않았으면 true. */
export function shouldReloadForStaleChunk(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  if (!staleChunkErrors.has(error)) return false;
  try {
    const reloadedAt = Number(sessionStorage.getItem(RELOADED_AT_KEY));
    if (Date.now() - reloadedAt < RELOAD_GUARD_MS) return false;
    // 읽기만 되고 쓰기가 막힌 환경(저장 공간 초과)에서는 새로고침 시각을 남길 수 없어 반복을 막지 못함.
    // 이 결과로 에러 화면을 그릴지 정하므로 쓰기까지 되는지 지금 확인함(같은 값을 쓰고 지워 여러 번 불러도 같음).
    sessionStorage.setItem(RELOADED_AT_KEY, "0");
    sessionStorage.removeItem(RELOADED_AT_KEY);
    return true;
  } catch {
    return false;
  }
}

/** 새로고침 시각을 남기고 지금 주소를 다시 불러 새 배포의 화면 코드를 받음. */
export function reloadForStaleChunk() {
  sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
  window.location.reload();
}
