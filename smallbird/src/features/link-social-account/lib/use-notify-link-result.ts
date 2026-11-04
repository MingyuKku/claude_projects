import { toast } from "sonner";

import { useTranslation } from "@/shared/i18n";

import type { SocialLinkOutcome, SocialProvider } from "@/entities/account";

// 연결(`POST`) 결과를 토스트로 알림. 카드(토큰을 바로 받는 SNS)와 공급자 화면에서 돌아온 뒤의 화면(네이버)이 같은 문구를 씀.
// 사유별 문구가 없는 실패(토큰 오류·공급자 오류 등)는 일반 실패 문구.
export function useNotifyLinkResult() {
  const { t } = useTranslation("features/link-social-account");

  return (provider: SocialProvider, outcome: SocialLinkOutcome) => {
    const name = t(`provider.${provider}`);
    if (outcome.status === "linked") {
      toast(t("link.toast.done", { provider: name }));
      return;
    }
    switch (outcome.reason) {
      case "SNS_ALREADY_LINKED":
        toast.error(t("link.toast.alreadyLinked", { provider: name }));
        return;
      case "SNS_LINKED_TO_OTHER_USER":
        toast.error(t("link.toast.linkedToOther", { provider: name }));
        return;
      case "SNS_EMAIL_REQUIRED":
        toast.error(t("link.toast.emailRequired"));
        return;
      default:
        toast.error(t("link.toast.failed"));
    }
  };
}
