import { SERVER_CHARGE_STATUS } from "@/entities/bigbird-money";

import type { ChargeQuery } from "../model/charge-types";
import type { FilterValues } from "@/shared/components/list-filter";

const SERVER_TYPE = { charge: "CHARGE", withdraw: "WITHDRAWAL" } as const;

function hasKey<T extends object>(
  map: T,
  key: string,
): key is Extract<keyof T, string> {
  return Object.hasOwn(map, key);
}

/** 주소의 필터 값을 서버 요청 조건으로 바꿈(쪽 번호 제외). 값이 없는 조건은 보내지 않음. */
export function toChargeQuery(
  filters: FilterValues,
  entrySize: number,
): Omit<ChargeQuery, "page"> {
  const { type, status, dateFrom, dateTo } = filters;
  return {
    entrySize,
    ...(type && hasKey(SERVER_TYPE, type) && { type: SERVER_TYPE[type] }),
    ...(status &&
      hasKey(SERVER_CHARGE_STATUS, status) && {
        status: SERVER_CHARGE_STATUS[status],
      }),
    ...(dateFrom && dateTo && { startDate: dateFrom, endDate: dateTo }),
  };
}
