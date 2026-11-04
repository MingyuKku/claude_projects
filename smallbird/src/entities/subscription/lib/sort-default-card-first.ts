import type { BillingCard } from "../model/types";

/** 기본 카드를 맨 앞으로(시안: 기본 카드가 첫 자리, 바꾸면 새 기본 카드가 앞으로 옴). 나머지는 서버가 준 순서. */
export function sortDefaultCardFirst(cards: BillingCard[]): BillingCard[] {
  return [
    ...cards.filter((card) => card.isDefault),
    ...cards.filter((card) => !card.isDefault),
  ];
}
