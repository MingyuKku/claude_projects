import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface CampaignStatusReturnState {
  /** 현황이 마지막으로 보여 준 쿼리(`?tab=draft&q=…`, 없으면 빈 문자열). 등록 화면의 헤더 "<"가 이 쿼리로 현황을 열어 탭·검색을 되살림. */
  search: string;
  /** 현황이 마지막으로 그려진 방문 기록 항목(`location.key`). 헤더 "<"가 이 기록으로 되돌아가 스크롤 위치까지 되살림. */
  entryKey: string | null;
  remember: (search: string, entryKey: string) => void;
}

// 현황의 탭·필터는 주소 쿼리가 원본이라 화면을 떠나면 사라짐. 등록 화면은 기록과 무관하게 현황으로 가야 해서(들어온 길이 개설 화면일 수 있음)
// 마지막 쿼리와 기록 항목만 메모리에 둠. 새로고침하면 비워지고 기본 현황으로 감.
export const useCampaignStatusReturnStore = create<CampaignStatusReturnState>()(
  devtools(
    (set) => ({
      search: "",
      entryKey: null,
      remember: (search, entryKey) => set({ search, entryKey }),
    }),
    { name: "campaign-status-return" },
  ),
);
