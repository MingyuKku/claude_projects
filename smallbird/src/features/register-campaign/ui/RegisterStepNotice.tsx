import { Inform } from "@/shared/components/inform";
import { useTranslation } from "@/shared/i18n";

import {
  isLockedInRevision,
  REVISION_LOCK_NOTICE_KEYS,
} from "../model/revision";
import { useRegisterWizardStore } from "../model/wizard-context";

import type { CampaignRegisterStep } from "@/entities/campaign";

interface RegisterStepNoticeProps {
  step: CampaignRegisterStep;
}

// 단계 제목 위 안내. 기자단형 2단계(시안 13320:116000)와 부가서비스(13385:248323). 문구의 "'모집가이드 작성' 단계"는 기획 변경으로
// "캠페인 소개서"로 씀(스펙 §3 2단계).
export function RegisterStepNotice({ step }: RegisterStepNoticeProps) {
  const { t } = useTranslation("features/register-campaign");
  const campaignType = useRegisterWizardStore(
    (state) => state.draft.info.campaignType,
  );
  const isRevisionMode = useRegisterWizardStore(
    (state) => state.isRevisionMode,
  );

  if (isRevisionMode && isLockedInRevision(step)) {
    return (
      <Inform
        variant="filled"
        items={[{ id: "locked", text: t(REVISION_LOCK_NOTICE_KEYS[step]) }]}
      />
    );
  }

  if (step === "add-ons") {
    return (
      <Inform
        variant="filled"
        title={t("addOns.noticeTitle")}
        items={[{ id: "optional", text: t("addOns.noticeText") }]}
      />
    );
  }

  if (step !== "product" || campaignType !== "PRESS") return null;

  return (
    <Inform
      variant="filled"
      title={t("product.press.noticeTitle")}
      items={[
        { id: "about", text: t("product.press.noticeAbout") },
        { id: "guide", text: t("product.press.noticeGuide") },
      ]}
    />
  );
}
