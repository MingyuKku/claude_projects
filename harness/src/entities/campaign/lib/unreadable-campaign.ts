import { isApiError, readApiErrorReason } from "@/shared/api";

// 캠페인을 읽을 수 없게 된 경우: 남의 캠페인·Sub ID에 배정되지 않음(403), 없거나 삭제됨(404).
const UNREADABLE_CAMPAIGN_REASONS = [
  "CAMPAIGN_ACCESS_DENIED",
  "CAMPAIGN_NOT_FOUND",
];
const NOT_FOUND_STATUS = 404;

export function isUnreadableCampaignReason(reason: string | undefined) {
  return reason !== undefined && UNREADABLE_CAMPAIGN_REASONS.includes(reason);
}

export function isUnreadableCampaignError(error: unknown) {
  return (
    (isApiError(error) && error.status === NOT_FOUND_STATUS) ||
    isUnreadableCampaignReason(readApiErrorReason(error))
  );
}
