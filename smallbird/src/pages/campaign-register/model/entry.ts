import type { ApprovalStatus } from "@/entities/campaign";

/**
 * 작성 주소로 들어온 캠페인을 어디서 보여 줄지. 승인 요청 이후 상태(검토중·반려·재승인 검토중·승인 완료)는 등록 내역으로 보내고,
 * 등록 중(승인 요청을 취소한 뒤 포함)은 작성 화면에서 엶. 반려 후 "수정"으로 온 경우는 예외라 `step`이 있을 때만 작성 화면에서 엶(스펙 P-19).
 */
export function resolveRegisterEntry(
  status: ApprovalStatus,
  hasStepParam: boolean,
): "wizard" | "detail" {
  if (status === "DRAFT") return "wizard";
  if (status === "REJECTED" && hasStepParam) return "wizard";
  return "detail";
}
