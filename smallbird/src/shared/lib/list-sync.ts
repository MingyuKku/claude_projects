import { useEffect, useEffectEvent, useSyncExternalStore } from "react";

// 무한 스크롤 목록을 다시 읽어야 하는지 판단하는 목록별 버전. 이 앱 밖에서도 바뀌는 목록은 바뀐 것을 알 수 없으므로,
// 화면을 떠났거나 다시 읽기를 요청했을 때 버전을 올리고 목록은 다시 보일 때 버전을 맞춤.
// 목록 이름(`list`)은 쓰는 슬라이스가 정하고, 서로 다른 목록끼리 겹치지 않게 슬라이스 이름을 앞에 붙임.
const versions = new Map<string, number>();
const listeners = new Set<() => void>();
// 목록 캐시(목록 이름·조건별)가 마지막으로 맞춘 버전.
const syncedVersions = new Map<string, number>();

function getVersion(list: string) {
  return versions.get(list) ?? 0;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 읽어 둔 목록이 낡았다고 표시함. 보이는 목록은 바로, 보이지 않는 목록은 다음에 보일 때 다시 읽음. */
export function markListsStale(...lists: string[]) {
  for (const list of lists) versions.set(list, getVersion(list) + 1);
  for (const listener of listeners) listener();
}

/**
 * 목록 캐시(`syncKey`)를 `version`에 맞춘 것으로 적고, 다시 읽어야 하면 true. 캐시가 없어 지금 읽는 중이면 그 값이 최신이라
 * 다시 읽지 않음. 캐시가 있는데 맞춘 기록이 없으면(다른 화면이 먼저 읽어 둔 경우) 언제 읽었는지 몰라 다시 읽음.
 */
function takeSync(syncKey: string, version: number, hasData: boolean) {
  const syncedVersion = syncedVersions.get(syncKey);
  syncedVersions.set(syncKey, version);
  return hasData && syncedVersion !== version;
}

/**
 * 목록이 보일 때(마운트·조건 변경·폭 전환으로 켜질 때)와 버전이 오를 때 버전을 맞추고, 낡았으면 `reload`로 다시 읽음.
 * `useInfinitePages`는 쪽 경계가 밀리지 않게 스스로 다시 읽지 않고, 전역 `mutate`로는 이어 읽은 쪽을 다시 읽지 못해 여기서 `reload`를 부름.
 * `listKey`는 같은 목록의 조건(검색·필터)을 구분함. 같은 목록 이름에 묶인 다른 캐시(필터 선택지 등)도 이 훅으로 같은 시점에 다시 읽을 수 있음.
 */
export function useListSync(
  list: string,
  listKey: string,
  {
    isEnabled,
    hasData,
    reload,
  }: { isEnabled: boolean; hasData: boolean; reload: () => unknown },
) {
  const version = useSyncExternalStore(subscribe, () => getVersion(list));
  const syncKey = `${list}:${listKey}`;

  const reloadList = useEffectEvent(() => {
    void reload();
  });
  useEffect(() => {
    if (!isEnabled) return;
    if (takeSync(syncKey, version, hasData)) reloadList();
  }, [syncKey, version, isEnabled, hasData]);
}

/** 화면을 떠날 때 목록들을 낡았다고 표시해, 다시 들어오면 한 번 다시 읽게 함. 화면 안에서 상세·탭을 오가며 다시 그려질 때는 읽지 않음. */
export function useMarkListsStaleOnLeave(...lists: string[]) {
  const markOnLeave = useEffectEvent(() => markListsStale(...lists));
  useEffect(() => () => markOnLeave(), []);
}

/** 테스트 사이에 앞 테스트의 버전이 남지 않게 비움. */
export function resetListSync() {
  versions.clear();
  listeners.clear();
  syncedVersions.clear();
}
