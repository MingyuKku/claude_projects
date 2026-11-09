import { EmptyState } from "@/shared/components/empty-state";
import { Inform } from "@/shared/components/inform";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import { useCampaignRegisterStore } from "../../../model/store-context";

// 기자단형 2단계(Figma 7555:333957): 입력은 없고 안내 박스(카드 위)와 빈 상태(카드 안)만 있음.
// 시안 문구의 "'모집가이드 작성' 단계"는 기획 변경으로 "캠페인 소개서"로 통일함(스펙 §3 2단계). 두 서비스 유형 모두 같음.
function useIntroStepName() {
  const { t } = useTranslation("features/register-campaign");

  return t("product.press.stepName");
}

/** 카드 위에 놓이는 "다음 단계에서 입력해주세요." 안내 박스. */
export function ProductPressNotice() {
  const { t } = useTranslation("features/register-campaign");
  const stepName = useIntroStepName();
  const campaignType = useCampaignRegisterStore(
    (state) => state.draft.campaignInfo.campaignType,
  );

  if (campaignType !== "PRESS") return null;

  return (
    <Inform
      variant="filled"
      title={t("product.press.notice.title")}
      items={[
        { id: "scope", text: t("product.press.notice.scope") },
        { id: "guide", text: t("product.press.notice.guide", { stepName }) },
      ]}
    />
  );
}

interface ProductPressEmptyProps {
  className?: string;
}

/** 카드 안의 "별도의 협찬 정보 입력이 없습니다." 빈 상태. */
export function ProductPressEmpty({ className }: ProductPressEmptyProps) {
  const { t } = useTranslation("features/register-campaign");
  const stepName = useIntroStepName();

  return (
    <EmptyState
      type="no-input"
      className={cn("py-12 desktop:py-20", className)}
      title={t("product.press.empty.title")}
      description={
        <>
          {t("product.press.empty.description1")}
          <br />
          {t("product.press.empty.description2", { stepName })}
        </>
      }
    />
  );
}
