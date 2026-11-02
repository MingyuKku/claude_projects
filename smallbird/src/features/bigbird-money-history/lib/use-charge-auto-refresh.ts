import { useEffect, useRef } from "react";

import { useRefreshBigbirdMoneyBalance } from "@/entities/bigbird-money";

import { useReloadChargeHistory } from "../api/use-charge-history";
import {
  CHARGE_FOCUS_REFRESH_THROTTLE_MS,
  CHARGE_PENDING_REFRESH_INTERVAL_MS,
} from "../model/constants";

import type { ChargeRecord } from "../model/charge-types";

/**
 * 충전/출금 내역을 서버 상태에 맞춰 다시 읽음. 입금·출금 처리 시점을 프론트가 알 수 없어 두 경우에 읽음.
 * - 탭이 다시 보이거나 창이 포커스를 되찾을 때(은행 앱에 다녀온 직후): 항상.
 * - "대기 중" 건이 보이는 동안 `CHARGE_PENDING_REFRESH_INTERVAL_MS`마다: 숨은 탭에서는 읽지 않음.
 * 잔액(헤더·보유 금액)이 입금·출금 처리로 바뀌므로 내역과 함께 읽음.
 * SWR의 `revalidateOnFocus`·`refreshInterval`은 이어 읽는 목록(`revalidateFirstPage: false`)의 읽은 쪽을 다시 읽지 않아 쓰지 않음.
 */
export function useChargeAutoRefresh(records: readonly ChargeRecord[]) {
  const reloadHistory = useReloadChargeHistory();
  const refreshBalance = useRefreshBigbirdMoneyBalance();
  const hasPending = records.some((record) => record.status === "pending");

  // 이벤트·타이머가 매번 다시 붙지 않도록 최신 함수를 ref로 들고 있음.
  const refreshRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    refreshRef.current = () => {
      void Promise.all([reloadHistory(), refreshBalance()]);
    };
  });

  useEffect(() => {
    let lastRefreshedAt = 0;

    function refreshIfVisible() {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRefreshedAt < CHARGE_FOCUS_REFRESH_THROTTLE_MS) return;
      lastRefreshedAt = now;
      refreshRef.current();
    }

    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, []);

  useEffect(() => {
    if (!hasPending) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshRef.current();
    }, CHARGE_PENDING_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [hasPending]);
}
