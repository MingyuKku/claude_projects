import { useSubscriptions } from "@/entities/subscription";

import { LoadFailedState } from "./LoadFailedState";

import type { Subscription } from "@/entities/subscription";
import type { ReactNode } from "react";

interface SubscriptionsGateProps {
  skeleton: ReactNode;
  children: (subscriptions: Subscription[]) => ReactNode;
}

// 구독 중인 상품을 읽는 구독 탭·결제내역·이용요약이 함께 쓰는 로딩·오류 처리. 같은 SWR 키라 한 번만 요청함.
export function SubscriptionsGate({
  skeleton,
  children,
}: SubscriptionsGateProps) {
  const { data, isLoading, isError, mutate } = useSubscriptions();

  if (isLoading) return skeleton;

  if (isError || !data) {
    return <LoadFailedState onRetry={() => void mutate()} />;
  }

  return children(data);
}
