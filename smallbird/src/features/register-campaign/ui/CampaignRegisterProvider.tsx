import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";

import {
  campaignDraftKey,
  campaignKey,
  saveCampaignDraft,
  useInitialCampaignDraft,
} from "@/entities/campaign";

import { createAutosaveController } from "../model/autosave";
import { CampaignRegisterSaveContext } from "../model/save-context";
import { createCampaignRegisterStore } from "../model/store";
import { CampaignRegisterStoreContext } from "../model/store-context";

import type { CampaignDraft } from "@/entities/campaign";
import type { ReactNode } from "react";

interface CampaignRegisterProviderProps {
  campaignId: number;
  children: ReactNode;
  /** 서버 초안을 읽는 동안 보일 화면. */
  fallback?: ReactNode;
}

// 서버 초안을 읽어 store를 한 번만 채우고, 그 아래에 store와 자동 저장을 내려 줌. 읽기에 실패하면 던져서 라우트의 오류 화면이 받음(없는 캠페인은 404).
export function CampaignRegisterProvider({
  campaignId,
  children,
  fallback = null,
}: CampaignRegisterProviderProps) {
  const { draft, error } = useInitialCampaignDraft(campaignId);

  if (error) throw error;
  if (!draft) return fallback;
  return (
    <StoreProvider key={campaignId} draft={draft}>
      {children}
    </StoreProvider>
  );
}

function StoreProvider({
  draft,
  children,
}: {
  draft: CampaignDraft;
  children: ReactNode;
}) {
  const { mutate } = useSWRConfig();
  // 처음 받은 초안으로만 채움. 이후 서버 값이 바뀌어도 입력 중인 값을 되돌리지 않음.
  const [store] = useState(() => createCampaignRegisterStore(draft));
  const [autosave] = useState(() =>
    createAutosaveController({
      store,
      save: saveCampaignDraft,
      // 저장 응답은 SWR 캐시만 갱신하고 store를 다시 채우지 않음. 캐시가 옛 값이면 같은 캠페인에 다시 들어올 때 옛 입력으로 채워지므로
      // 초안 캐시는 저장한 값으로 맞추고, 등록 내역 캐시는 비워 다음에 새로 읽게 함.
      onSaved: (sent, result) =>
        Promise.all([
          mutate(
            campaignDraftKey(sent.campaignIdx),
            {
              ...sent,
              version: result.version,
              updatedAt: result.updatedAt,
              campaignInfo: { ...sent.campaignInfo, endDate: result.endDate },
            },
            { revalidate: false },
          ),
          mutate(campaignKey(sent.campaignIdx), undefined, {
            revalidate: false,
          }),
        ]).catch(() => undefined),
    }),
  );

  useEffect(() => autosave.start(), [autosave]);

  return (
    <CampaignRegisterStoreContext value={store}>
      <CampaignRegisterSaveContext value={autosave}>
        {children}
      </CampaignRegisterSaveContext>
    </CampaignRegisterStoreContext>
  );
}
