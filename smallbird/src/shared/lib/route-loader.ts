import { useEffect } from "react";
import { redirect, replace } from "react-router";
import { useSWRConfig } from "swr";

import type { DataRouter } from "react-router";
import type { Arguments, ScopedMutator } from "swr";

// SWR에는 SWRConfig provider 캐시에 React 밖(route loader)에서 쓰는 공개 API가 없어 화면 트리의 mutate를 등록해 둠.
let cacheMutate: ScopedMutator | null = null;
// 라우터가 첫 진입의 loader를 끝냈는지. 끝내기 전 loader는 요청 주소가 이미 방문 기록에 있음.
// 첫 진입 중에도 loader가 없는 루트 레이아웃은 먼저 그려지므로 화면 렌더 여부로는 알 수 없음.
let isRouterInitialized = false;

/** 라우터를 만든 직후 호출함. 첫 진입이 끝났는지를 `entryRedirect`가 알 수 있게 함. */
export function trackRouterInitialized(router: DataRouter) {
  isRouterInitialized = router.state.initialized;
  if (isRouterInitialized) return;
  const unsubscribe = router.subscribe((state) => {
    if (!state.initialized) return;
    isRouterInitialized = true;
    unsubscribe();
  });
}

/** loader가 화면의 SWR 캐시에 쓸 수 있게 등록함. 라우터 안 최상위 레이아웃에서 한 번 호출함. */
export function useRouteLoaderBridge() {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    cacheMutate = mutate;
    return () => {
      if (cacheMutate === mutate) cacheMutate = null;
    };
  }, [mutate]);
}

/**
 * loader가 읽은 값을 화면이 볼 SWR 캐시에 넣어, 화면이 처음부터 그 값으로 그려지게 함.
 * 아직 등록 전이면 넣지 않고, 화면의 SWR 훅이 비어 있는 캐시를 보고 읽음.
 */
export async function fillLoaderCache(key: Arguments, data: unknown) {
  await cacheMutate?.(key, data, { revalidate: false });
}

/**
 * 요청한 화면 대신 다른 화면으로 보내는 loader 응답. 앱 안 이동은 요청 주소가 아직 방문 기록에 없어 그 이동을 대신하고,
 * 첫 진입은 요청 주소가 이미 기록에 있어 바꿔 씀(라우터 기본값은 기록을 쌓아 뒤로가기가 다시 이 주소로 돌아옴).
 */
export function entryRedirect(path: string) {
  return isRouterInitialized ? redirect(path) : replace(path);
}
