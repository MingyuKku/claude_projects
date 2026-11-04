import type { SubscriptionProductType } from "../model/codes";
import type { Subscription } from "../model/types";

/**
 * 새로 구독할 수 없는("구독 중") 상품. 구독 탭의 "구독 중" 표시와 결제 화면 진입 차단이 같은 기준을 씀.
 * 목록에 있는 구독은 상태와 상관없이 구독 중으로 봄: 해지 예정은 종료일까지 이용 중이고, 결제 실패(`paymentFailed`)는
 * 서버가 재구독을 허용하지만 시안 전까지 "구독 중"으로 둠(스펙 §7 P-17).
 */
export function getSubscribedTypes(
  subscriptions: Subscription[],
): ReadonlySet<SubscriptionProductType> {
  return new Set(subscriptions.map((item) => item.type));
}
