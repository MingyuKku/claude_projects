import type { BillingCard, Subscription } from "@/entities/subscription";

// 이 상태의 구독이 있으면 서버가 기본 카드 삭제를 거절함(그 카드로 재결제하므로). 해지 예정(`cancelScheduled`)은 백엔드 문서가
// "해지 예정도 구독 중으로 취급"과 "모두 해지했으면 삭제 가능"으로 갈려 있어 미리 막지 않고 서버 판단에 맡김.
const CHARGING_STATUSES: readonly Subscription["status"][] = [
  "active",
  "paymentFailed",
];

interface DeleteContext {
  cards: BillingCard[];
  /** 구독 목록. 읽기에 실패했으면 undefined. */
  subscriptions: Subscription[] | undefined;
  /** 구독 목록을 처음 읽는 중. */
  isSubscriptionsLoading: boolean;
}

/**
 * 카드 삭제를 보여 줄지. 여분 카드는 항상 지울 수 있음.
 * 기본 카드는 다른 카드가 없을 때만 지울 수 있음(다른 카드가 있는데 지우면 남은 카드가 자동으로 기본이 되어 의도하지 않은
 * 카드로 결제될 수 있어 먼저 결제 카드로 등록하게 함, 스펙 §3). 그때도 결제가 이어지는 구독이 있으면 서버가 확실히 거절하므로
 * 미리 막음(보여 준 뒤 거절되면 카드가 사라졌다 되돌아오는 깜빡임이 생김).
 * 구독 목록을 읽는 중에는 아직 모르므로 보이지 않고(보였다 사라지면 그 사이에 눌릴 수 있음), 읽기에 실패했으면 서버 판단에 맡김.
 */
export function canDeleteCard(
  card: BillingCard,
  { cards, subscriptions, isSubscriptionsLoading }: DeleteContext,
) {
  if (!card.isDefault) return true;
  if (cards.length > 1) return false;
  if (isSubscriptionsLoading) return false;
  return !subscriptions?.some((item) =>
    CHARGING_STATUSES.includes(item.status),
  );
}
