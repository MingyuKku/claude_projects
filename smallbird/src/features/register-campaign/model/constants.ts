/** 방문 혜택·구매 관련 안내의 최대 글자 수(2단계). */
export const PRODUCT_TEXT_MAX_LENGTH = 300;
/** 캠페인 설명·유의사항의 최대 글자 수(5단계, 직접 작성과 AI 결과 모두). */
export const INTRO_TEXT_MAX_LENGTH = 1000;
/** 상품 상세 이미지/동영상 개수(5단계). */
export const INTRO_MEDIA_MIN_COUNT = 1;
export const INTRO_MEDIA_MAX_COUNT = 5;
/** 이 금액 이상의 협찬제품만 "대여 상품"으로 고를 수 있음(2단계, 디자이너 주석). */
export const RENTAL_MIN_PRODUCT_PRICE = 1_000_000;
/** 자동 저장: 마지막 입력 후 이만큼 지나면 저장함. */
export const AUTOSAVE_DEBOUNCE_MS = 3_000;
/** 자동 저장: 입력이 계속돼도 바뀐 내용이 남아 있는 동안 최대 이 간격마다 저장함. */
export const AUTOSAVE_MAX_WAIT_MS = 30_000;
/** 자동 저장이 실패하면 이만큼 뒤 다음 주기에 다시 보냄(서버가 불안정할 때 몰아치지 않도록 최대 간격과 같게 둠). */
export const AUTOSAVE_RETRY_MS = 30_000;

/** 포스팅 유지기간 프리셋(개월). 이 밖의 값은 "직접 입력". */
export const POSTING_PERIOD_PRESET_MONTHS = [1, 3, 6, 12] as const;
