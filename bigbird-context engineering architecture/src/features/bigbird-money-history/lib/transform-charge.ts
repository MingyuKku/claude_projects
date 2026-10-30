import { parseServerDate } from "@/entities/account";
import { toChargeStatus } from "@/entities/bigbird-money";
import { toReceiptUrl } from "@/shared/lib/receipt";

import { LIST_PAGE_SIZE } from "../model/constants";

import type { ChargeList } from "../model/charge-schema";
import type { ChargeListViewModel } from "../model/charge-types";

const EMPTY_TEXT = "-";
/** 입금 전에는 입금 완료일이 이 값으로 옴. */
const NO_DATE = "N/A";

function dateText(value: string | null | undefined) {
  const text = value?.trim();
  return text && text !== NO_DATE ? text : EMPTY_TEXT;
}

function textOrDash(value: string | null | undefined) {
  return value?.trim() ? value : EMPTY_TEXT;
}

export function transformChargeList(list: ChargeList): ChargeListViewModel {
  return {
    records: list.list.map((item, index) => {
      const statusText = item.depositState?.trim() ?? "";
      const status = toChargeStatus(statusText);
      const depositedAtText = dateText(item.depositDate);
      return {
        id: String(index),
        requestedAt: parseServerDate(item.requestDate),
        requestedAtText: dateText(item.requestDate),
        amount: item.requestAmount ?? null,
        payMethod: item.payMethod?.trim() ?? "",
        status,
        statusText: statusText || EMPTY_TEXT,
        bankName: textOrDash(item.bankName),
        accountNumber: textOrDash(item.accountNumber),
        depositedAt:
          depositedAtText === EMPTY_TEXT
            ? null
            : parseServerDate(item.depositDate),
        depositedAtText,
        // 거래명세서는 결제 완료 건만 켬(스펙 §3).
        receiptUrl: status === "paid" ? toReceiptUrl(item.receiptUrl) : null,
      };
    }),
    totalCount: list.count,
    page: list.currentPage,
    totalPages: Math.ceil(list.count / LIST_PAGE_SIZE),
  };
}
