import useSWR from "swr";

import {
  fetchProposalConversation,
  fetchProposalInfo,
} from "./proposal-detail-api";

export function useProposalConversation(proposalIdx: number) {
  const { data, error, isLoading, mutate } = useSWR(
    ["campaign-progress", "proposal-messages", proposalIdx] as const,
    ([, , idx]) => fetchProposalConversation(idx),
  );
  return { conversation: data, error, isLoading, mutate };
}

// 메모는 입력 중인 값을 화면이 들고 있어, 창에 다시 돌아와도 서버 값으로 덮지 않음.
export function useProposalInfo(proposalIdx: number) {
  const { data, error, isLoading, mutate } = useSWR(
    ["campaign-progress", "proposal-info", proposalIdx] as const,
    ([, , idx]) => fetchProposalInfo(idx),
    { revalidateOnFocus: false },
  );
  return { info: data, error, isLoading, mutate };
}
