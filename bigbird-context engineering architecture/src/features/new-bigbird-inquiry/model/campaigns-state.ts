import type { InquiryCampaignsState } from "../ui/NewBigbirdInquiryForm";

// 다시 불러오기가 실패해도 SWR은 이전 목록을 유지함. 보여 줄 목록이 있으면 그대로 쓰고,
// 처음 조회가 실패해 목록이 없을 때만 오류로 표시함.
export function getCampaignsState({
  hasData,
  isLoading,
  isError,
}: {
  hasData: boolean;
  isLoading: boolean;
  isError: boolean;
}): InquiryCampaignsState {
  if (hasData) return "ready";
  if (isError) return "error";
  if (isLoading) return "loading";
  return "ready";
}
