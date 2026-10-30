import { useSubscriptionPlans } from "@/entities/subscription";

import { LoadFailedState } from "./LoadFailedState";
import { PlanCardsSkeleton } from "./PlanCardsSkeleton";

import type { SubscriptionPlanCatalog } from "@/entities/subscription";
import type { ReactNode } from "react";

interface SubscriptionPlansGateProps {
  children: (catalog: SubscriptionPlanCatalog) => ReactNode;
}

// 상품 목록을 읽는 구독 탭과 결제 화면이 함께 쓰는 로딩·오류 처리. 같은 SWR 키라 한 번만 요청함.
export function SubscriptionPlansGate({
  children,
}: SubscriptionPlansGateProps) {
  const { data, isLoading, isError, mutate } = useSubscriptionPlans();

  if (isLoading) return <PlanCardsSkeleton />;

  if (isError || !data) {
    return <LoadFailedState onRetry={() => void mutate()} />;
  }

  return children(data);
}
