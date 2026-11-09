import { createContext, use } from "react";
import { useStore } from "zustand";

import type { CampaignRegisterStore, CampaignRegisterStoreApi } from "./store";

export const CampaignRegisterStoreContext =
  createContext<CampaignRegisterStoreApi | null>(null);

/** 마법사 store를 구독함. 필요한 값만 selector로 고름. */
export function useCampaignRegisterStore<T>(
  selector: (state: CampaignRegisterStore) => T,
): T {
  return useStore(useCampaignRegisterStoreApi(), selector);
}

/** 구독하지 않고 store를 직접 다룸(자동 저장 같은 이벤트 처리에서 최신 값을 읽을 때). */
export function useCampaignRegisterStoreApi() {
  const store = use(CampaignRegisterStoreContext);
  if (!store) {
    throw new Error(
      "useCampaignRegisterStore must be used inside CampaignRegisterProvider",
    );
  }
  return store;
}
