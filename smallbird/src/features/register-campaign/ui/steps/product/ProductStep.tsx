import { EmptyState } from "@/shared/components/empty-state";
import { Trans, useTranslation } from "@/shared/i18n";
import { Card } from "@/shared/ui/card";

import { useRegisterWizardStore } from "../../../model/wizard-context";
import { ProductDeliveryFields } from "./ProductDeliveryFields";
import { ProductStoreVisitFields } from "./ProductStoreVisitFields";

// 2단계 제품 정보. 1단계에서 고른 유형의 입력만 보이고 유형 표시·전환 영역은 없음(3.0.3). 기자단형은 입력 없이 안내만.
export function ProductStep() {
  const { t } = useTranslation("features/register-campaign");
  const campaignType = useRegisterWizardStore(
    (state) => state.draft.info.campaignType,
  );

  if (campaignType === "PRESS") {
    return (
      // 시안 카드 높이가 기기별 고정값이라 토큰이 아닌 값으로 둠.
      <Card className="min-h-54 justify-center ds-p-6 tablet:min-h-76.5 desktop:min-h-110">
        <EmptyState
          type="no-input"
          title={t("product.press.emptyTitle")}
          description={
            <Trans
              t={t}
              i18nKey="product.press.emptyDescription"
              components={{ br: <br /> }}
            />
          }
        />
      </Card>
    );
  }

  return (
    <Card className="ds-gap-4 ds-p-6">
      {campaignType === "STORE_VISIT" ? (
        <ProductStoreVisitFields />
      ) : (
        <ProductDeliveryFields />
      )}
    </Card>
  );
}
