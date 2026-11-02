import { useLocation } from "react-router";

import { JoinWizard, readSnsTokenData } from "@/features/join";
import { socialLink } from "@/features/social-login";
import { useTranslation } from "@/shared/i18n";

export function JoinPage() {
  const { t } = useTranslation("pages/join");
  const { state } = useLocation();
  // SNS로 가입하는 경우 연동할 신원이 라우터 state로 들어옴.
  const tokenData = readSnsTokenData(state);

  return (
    <>
      <title>{t("title")}</title>
      <JoinWizard tokenData={tokenData} onLinkSocial={socialLink} />
    </>
  );
}
