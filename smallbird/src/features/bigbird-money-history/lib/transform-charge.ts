import { parseServerDate } from "@/entities/account";
import { toChargeStatus } from "@/entities/bigbird-money";
import { toReceiptUrl } from "@/shared/lib/receipt";

import type { ChargeList } from "../model/charge-schema";
import type { ChargeListViewModel, ChargeType } from "../model/charge-types";

const EMPTY_TEXT = "-";

// 객체 리터럴이면 프로토타입 이름도 조회되므로 Map으로 둠.
const CHARGE_TYPE_BY_SERVER_VALUE = new Map<string, ChargeType>([
  ["CHARGE", "charge"],
  ["WITHDRAWAL", "withdraw"],
]);

function textOrDash(value: string | null | undefined) {
  return value?.trim() ? value : EMPTY_TEXT;
}

export function transformChargeList(list: ChargeList): ChargeListViewModel {
  return {
    records: list.list.map((item) => {
      const type = CHARGE_TYPE_BY_SERVER_VALUE.get(item.type) ?? null;
      const status = toChargeStatus(item.status);
      return {
        id: `${type ?? item.type.toLowerCase()}-${item.id}`,
        serverId: item.id,
        type,
        typeText: textOrDash(item.type),
        requestedAt: parseServerDate(item.requestDate),
        requestedAtText: textOrDash(item.requestDate),
        amount: item.amount ?? null,
        payMethod: item.payMethod?.trim() ?? "",
        status,
        statusText: textOrDash(item.status),
        bankName: textOrDash(item.bankName),
        accountNumber: textOrDash(item.accountNumber),
        holderName: textOrDash(item.holderName),
        completedAt: parseServerDate(item.completedDate),
        completedAtText: textOrDash(item.completedDate),
        // 거래명세서는 입금 완료 건만 켬(스펙 §3). 대기 중 건도 주소가 오지만 가상계좌 발급 영수증이라 쓰지 않음.
        receiptUrl: status === "paid" ? toReceiptUrl(item.receiptUrl) : null,
      };
    }),
    totalCount: list.count,
    page: list.currentPage,
    totalPages: Math.ceil(list.count / Math.max(list.entrySize, 1)),
  };
}
