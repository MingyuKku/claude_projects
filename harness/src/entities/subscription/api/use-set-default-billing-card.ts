import { sortDefaultCardFirst } from "../lib/sort-default-card-first";
import { setDefaultBillingCard } from "./subscription-api";
import { useBillingCards } from "./use-subscription-data";

/**
 * 기본 카드 변경. 결제내역 탭 "결제 카드로 등록"과 결제 화면 카드 선택이 함께 씀.
 * 목록을 낙관적으로 먼저 바꾸고, 실패하면 되돌린 뒤 에러를 그대로 던짐(알림 문구는 쓰는 화면이 정함).
 * 성공하면 서버 값으로 다시 읽음.
 */
export function useSetDefaultBillingCard() {
  const { data: cards, mutate } = useBillingCards();

  return async function setDefault(cardId: string) {
    await mutate(() => setDefaultBillingCard(cardId).then(() => undefined), {
      optimisticData:
        cards &&
        sortDefaultCardFirst(
          cards.map((item) => ({ ...item, isDefault: item.id === cardId })),
        ),
      rollbackOnError: true,
      populateCache: false,
      revalidate: true,
    });
  };
}
