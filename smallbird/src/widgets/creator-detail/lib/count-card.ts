// 상세의 CountCard를 시안에 맞춤(공통 카드는 구독 사용량도 쓰므로 여기서만 덮음).
// 시안 테두리는 높이에 포함되는 안쪽 선.
const SHARED_CLASS_NAME =
  "border-0 inset-ring inset-ring-border max-tablet:[&_[data-slot=card-content]]:px-4 max-tablet:[&_[data-slot=card-header]]:px-4 max-tablet:[&_[data-slot=card-content]>p:first-child>span:first-child]:text-xl max-tablet:[&_[data-slot=card-content]>p:first-child>span:first-child]:leading-none";

export const COUNT_CARD_CLASS_NAME = `${SHARED_CLASS_NAME} [&_[data-slot=card-title]]:leading-6 max-tablet:[&_[data-slot=card-content]]:pb-4`;

/** 아래에 펼침 버튼이 붙는 지수 카드. 본문 아래 여백이 없음. */
export const INDEX_CARD_CLASS_NAME = `${SHARED_CLASS_NAME} max-tablet:[&>div:last-child]:p-4`;
