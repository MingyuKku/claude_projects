import { useState } from "react";
import { useSWRConfig } from "swr";

import { campaignDetailKey } from "@/entities/campaign";

import { createDraftSaver } from "../model/draft-saver";
import { createRegisterWizardStore } from "../model/store";
import { RegisterWizardContext } from "../model/wizard-context";

import type { CampaignDetail } from "@/entities/campaign";
import type { ReactNode } from "react";

interface RegisterWizardProviderProps {
  /** 진입할 때 한 번만 초안을 채우는 값. 캠페인이 바뀌면 호출하는 쪽이 `key`로 새로 만듦. */
  detail: CampaignDetail;
  children: ReactNode;
}

// 마법사 store와 저장기를 캠페인마다 한 번 만듦. 사이드바(셸 쪽)와 본문이 같은 store를 보도록 둘을 함께 감쌈.
export function RegisterWizardProvider({
  detail,
  children,
}: RegisterWizardProviderProps) {
  const { mutate } = useSWRConfig();
  const [value] = useState(() => {
    const store = createRegisterWizardStore(detail);
    // 저장 응답은 본문이 없어 상세 캐시만 다시 읽음. store는 다시 채우지 않음(스펙 §5).
    const saver = createDraftSaver(store, () =>
      mutate(campaignDetailKey(detail.campaignIdx)),
    );
    return { store, saver };
  });

  return (
    <RegisterWizardContext value={value}>{children}</RegisterWizardContext>
  );
}
