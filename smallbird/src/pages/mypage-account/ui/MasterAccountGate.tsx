import { useMasterAccount } from "@/entities/account";

import { LoadFailedState } from "./LoadFailedState";

import type { MasterAccountViewModel } from "@/entities/account";
import type { ReactNode } from "react";

interface MasterAccountGateProps {
  skeleton: ReactNode;
  children: (master: MasterAccountViewModel, refresh: () => void) => ReactNode;
}

// Master 정보를 읽는 탭이 함께 쓰는 로딩·오류 처리. 같은 SWR 키라 탭을 오가도 한 번만 요청함.
export function MasterAccountGate({
  skeleton,
  children,
}: MasterAccountGateProps) {
  const { master, isLoading, isError, mutate } = useMasterAccount(true);

  if (isLoading) return skeleton;

  if (isError || !master) {
    return <LoadFailedState onRetry={() => void mutate()} />;
  }

  return children(master, () => void mutate());
}
