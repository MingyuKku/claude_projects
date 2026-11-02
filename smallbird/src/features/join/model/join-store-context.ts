import { createContext, use } from "react";
import { useStore } from "zustand";

import type { JoinStore, JoinStoreApi } from "./store";

export const JoinStoreContext = createContext<JoinStoreApi | null>(null);

export function useJoinStore<T>(selector: (state: JoinStore) => T): T {
  const store = use(JoinStoreContext);
  if (!store)
    throw new Error("useJoinStore must be used inside JoinStoreProvider");
  return useStore(store, selector);
}
