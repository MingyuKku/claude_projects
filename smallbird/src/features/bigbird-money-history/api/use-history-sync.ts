import { useMarkListsStaleOnLeave } from "@/shared/lib";

/** 사용 내역 MO 목록·필터 선택지의 버전 이름(`shared/lib` `useListSync`). */
export const USAGE_SYNC = "bigbird-money-usage";
/** 충전/출금 내역 MO 목록의 버전 이름. */
export const CHARGE_SYNC = "bigbird-money-charge";

/**
 * 빅버드 머니 화면을 떠날 때 두 내역을 낡았다고 표시해, 다시 들어오면 한 번 다시 읽게 함. 화면 안에서 상세·탭을 오가며
 * 목록이 다시 그려질 때는 읽지 않음.
 */
export function useRevalidateHistoryOnReturn() {
  useMarkListsStaleOnLeave(USAGE_SYNC, CHARGE_SYNC);
}
