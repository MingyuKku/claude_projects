import { useId } from "react";
import { Navigate } from "react-router";
import useSWRImmutable from "swr/immutable";

import { useNotifyLinkResult } from "@/features/link-social-account";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";

import type { SocialLinkOutcome, SocialProvider } from "@/entities/account";

interface LinkCallbackScreenProps {
  provider: SocialProvider;
  /** 돌아온 주소에서 읽은 값으로 연결 API를 부름. 한 번만 실행됨. */
  completeLink: () => Promise<SocialLinkOutcome>;
}

// 계정 설정에서 간편 로그인 연결을 시작해 공급자 화면에서 돌아온 화면. 연결을 한 번 이어 가고 결과를 토스트로 알린 뒤 계정 설정으로 돌려보냄.
export function LinkCallbackScreen({
  provider,
  completeLink,
}: LinkCallbackScreenProps) {
  const { t } = useTranslation("features/social-login");
  const notifyLinkResult = useNotifyLinkResult();
  // 마운트마다 다른 키를 쓰고, StrictMode의 이중 마운트는 SWR이 요청 하나로 합침.
  const attemptId = useId();
  const { data } = useSWRImmutable(
    ["link-callback", provider, attemptId],
    async () => {
      const outcome = await completeLink();
      notifyLinkResult(provider, outcome);
      return outcome;
    },
    { shouldRetryOnError: false },
  );

  if (data) return <Navigate to={ROUTES.mypageAccount} replace />;

  return (
    <div className="flex min-h-dvh items-center justify-center text-gray-700">
      {t("processing")}
    </div>
  );
}
