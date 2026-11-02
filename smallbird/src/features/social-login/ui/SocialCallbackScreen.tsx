import { useId } from "react";
import { Navigate } from "react-router";
import useSWRImmutable from "swr/immutable";

import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";

import type { SocialLoginOutcome } from "../model/schema";

interface SocialCallbackScreenProps {
  completeLogin: () => Promise<SocialLoginOutcome>;
}

/**
 * OAuth 복귀 화면 네 개가 공유하는 껍데기: 로그인 완료를 한 번 실행한 뒤 리다이렉트만 함.
 * 성공은 메인으로, 미가입 SNS 계정(C02)은 연동 화면으로, 그 밖에는 로그인으로 보냄.
 */
export function SocialCallbackScreen({
  completeLogin,
}: SocialCallbackScreenProps) {
  const { t } = useTranslation("features/social-login");
  // 마운트마다 다른 키를 써서 이전 로그인의 캐시 결과가 재사용되지 않게 하고,
  // StrictMode의 이중 마운트는 SWR이 요청 하나로 합치게 함.
  const attemptId = useId();
  const { data, error } = useSWRImmutable(
    ["social-callback", attemptId],
    completeLogin,
    {
      shouldRetryOnError: false,
    },
  );

  if (error) return <Navigate to={ROUTES.login} />;

  if (data?.status === "success") return <Navigate to={ROUTES.main} />;
  if (data?.status === "needsLink") {
    return <Navigate to={ROUTES.snsLink} state={{ snsData: data.snsData }} />;
  }
  if (data) return <Navigate to={ROUTES.login} />;

  return (
    <div className="flex min-h-dvh items-center justify-center text-gray-700">
      {t("processing")}
    </div>
  );
}
