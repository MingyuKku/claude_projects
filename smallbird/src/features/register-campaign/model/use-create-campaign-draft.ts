import { useEffect, useRef, useState } from "react";

import { createCampaignDraft } from "@/entities/campaign";

import type { CampaignServiceType } from "@/entities/campaign";

/** 주소의 `?type=` 값. */
const SERVICE_TYPE_BY_PARAM: Record<string, CampaignServiceType> = {
  pick: "PICK",
  recruit: "RECRUIT",
};

/** `?type=pick|recruit`를 서비스 유형으로 바꿈. 없거나 잘못된 값이면 undefined(not-found). */
export function parseServiceTypeParam(value: string | null) {
  return value === null ? undefined : SERVICE_TYPE_BY_PARAM[value];
}

/**
 * 등록 화면에 들어오면 서버가 등록 중 캠페인을 만들고 캠페인 코드를 발급함(REQ-10-0052). 화면이 뜰 때 한 번만 만들고,
 * 만든 캠페인의 번호를 돌려줌(페이지가 주소를 그 캠페인의 작성 주소로 바꿈). 실패하면 `error`로 돌려줌.
 * 브랜드형만 다룸(공구형은 범위 밖).
 */
export function useCreateCampaignDraft(serviceType: CampaignServiceType) {
  const [result, setResult] = useState<
    { campaignIdx: number } | { error: unknown } | null
  >(null);
  // StrictMode가 효과를 두 번 돌려도 초안을 하나만 만들도록 시작 여부를 기억함.
  const isStartedRef = useRef(false);

  useEffect(() => {
    if (isStartedRef.current) return;
    isStartedRef.current = true;
    createCampaignDraft({ serviceType, productType: "BRAND" }).then(
      (draft) => setResult({ campaignIdx: draft.campaignIdx }),
      (error: unknown) => setResult({ error }),
    );
  }, [serviceType]);

  return {
    campaignIdx: result && "campaignIdx" in result ? result.campaignIdx : null,
    error: result && "error" in result ? result.error : null,
  };
}
