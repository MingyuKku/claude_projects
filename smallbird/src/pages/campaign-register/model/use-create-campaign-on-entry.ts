import { tryit } from "radash";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { createCampaign, getCampaignRegisterPath } from "@/entities/campaign";

/**
 * 진입하자마자 캠페인을 한 번 만들고(A-1) 작성 경로로 바꿈(replace). 서버가 중복 생성을 막지 않아, 개발 모드의 effect
 * 이중 실행에도 한 번만 보냄. 실패하면 오류를 돌려주고 화면이 라우트 오류 화면으로 넘김.
 */
export function useCreateCampaignOnEntry({
  isEnabled,
  isDemo,
}: {
  isEnabled: boolean;
  isDemo: boolean;
}) {
  const navigate = useNavigate();
  const hasStartedRef = useRef(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isEnabled || hasStartedRef.current) return;
    hasStartedRef.current = true;

    void (async () => {
      const [createError, created] = await tryit(createCampaign)({
        serviceType: "PICK",
        productType: "BRAND",
        demo: isDemo,
      });
      if (createError) {
        setError(createError);
        return;
      }
      void navigate(
        getCampaignRegisterPath(created.campaignIdx, "campaign-info"),
        { replace: true },
      );
    })();
  }, [isEnabled, isDemo, navigate]);

  return { error };
}
