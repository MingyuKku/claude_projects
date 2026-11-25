import { formatNumber } from "@/shared/i18n";
import { EMPTY_VALUE } from "@/shared/lib";

const THOUSAND = 1_000;
const MILLION = 1_000_000;
const DECIMAL_STEP = 10;

const COMPACT_OPTIONS = { maximumFractionDigits: 1 };
const INDEX_OPTIONS = { minimumFractionDigits: 1, maximumFractionDigits: 1 };

// 반올림하면 999,950이 `1000K`로 보여 소수 첫째 자리까지 내림. 정수 나눗셈이라 부동소수 오차가 없음.
function floorCompact(value: number, unit: number) {
  return Math.floor(value / (unit / DECIMAL_STEP)) / DECIMAL_STEP;
}

/** 1,000 이상은 `K`, 1,000,000 이상은 `M`. 소수는 첫째 자리까지이고 끝의 `.0`은 뺌(`1.2K`, `125K`). */
export function formatCompactCount(value: number) {
  if (value >= MILLION) {
    return `${formatNumber(floorCompact(value, MILLION), COMPACT_OPTIONS)}M`;
  }
  if (value >= THOUSAND) {
    return `${formatNumber(floorCompact(value, THOUSAND), COMPACT_OPTIONS)}K`;
  }
  return formatNumber(value);
}

/** 브랜드·공구 지수. 소수 첫째 자리로 맞춰 열 폭을 고르게 함. */
export function formatIndexScore(value: number | null) {
  return value === null ? EMPTY_VALUE : formatNumber(value, INDEX_OPTIONS);
}

/** 평균 댓글 작성자 수. 서버가 소수 첫째 자리까지 줌. */
export function formatAverageCount(value: number | null) {
  return value === null ? EMPTY_VALUE : formatNumber(value, COMPACT_OPTIONS);
}
