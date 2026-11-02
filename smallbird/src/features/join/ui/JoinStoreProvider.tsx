import { useState } from "react";

import { JoinStoreContext } from "../model/join-store-context";
import { createJoinStore } from "../model/store";

import type { SnsTokenData } from "../model/types";
import type { ReactNode } from "react";

interface JoinStoreProviderProps {
  children: ReactNode;
  /** Seeds the store once at mount. */
  tokenData?: SnsTokenData | null;
}

export function JoinStoreProvider({
  children,
  tokenData = null,
}: JoinStoreProviderProps) {
  const [store] = useState(() => createJoinStore(tokenData));
  return <JoinStoreContext value={store}>{children}</JoinStoreContext>;
}
