import { generatePath, useNavigate } from "react-router";

import { ROUTES } from "@/shared/config";

import { useCampaignRegisterStoreApi } from "./store-context";
import { useCampaignSave } from "./use-campaign-save";

/**
 * 수정 모드를 마치고 등록 내역으로 돌아감: 저장한 뒤 이동하고, 저장이 실패하면(실패 토스트) 이동하지 않음.
 * 고친 뒤 작성 화면으로 되돌아오지 않게 교체 이동함.
 */
export function useFinishEdit() {
  const navigate = useNavigate();
  const storeApi = useCampaignRegisterStoreApi();
  const { saveBeforeMove } = useCampaignSave();

  async function finishEdit() {
    if (!(await saveBeforeMove())) return;
    void navigate(
      generatePath(ROUTES.campaignDetail, {
        campaignId: String(storeApi.getState().draft.campaignIdx),
      }),
      { replace: true },
    );
  }

  return { finishEdit };
}
