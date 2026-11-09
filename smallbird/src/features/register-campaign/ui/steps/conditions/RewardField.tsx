import { PriceField } from "@/shared/components/text-field";
import { MEDIA_QUERY } from "@/shared/config";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";

import { parseNumberInput } from "../../../lib/number-input";
import { useCampaignRegisterStore } from "../../../model/store-context";

// 리워드(모집형 제품발송형·구매리뷰형): 인플루언서 1인당 금액. 상한은 상품 금액(제품발송형은 협찬제품 금액, 구매리뷰형은 구매제품 금액)이라
// 시안의 고정값("최대 50,000원")이 아니라 입력된 상품 금액으로 도움말을 만듦. 상품 금액이 아직 없으면 상한 문구를 빼고 보임.
export function RewardField() {
  const { t } = useTranslation("features/register-campaign");
  const reward = useCampaignRegisterStore(
    (state) => state.draft.conditions.rewardPerInfluencer,
  );
  const limit = useCampaignRegisterStore((state) =>
    state.draft.campaignInfo.campaignType === "PURCHASE_REVIEW"
      ? state.draft.product.purchasePrice
      : state.draft.product.productPrice,
  );
  const patchConditions = useCampaignRegisterStore(
    (state) => state.patchConditions,
  );
  // 모바일 시안은 좁은 칸에 맞춰 짧은 안내 문구를 씀("…금액 입력").
  const isMobile = useMediaQuery(MEDIA_QUERY.mobile);

  return (
    <div className="flex flex-col gap-2">
      <PriceField
        label={t("conditions.reward.label")}
        isRequired
        unit={t("conditions.reward.unit")}
        placeholder={t(
          isMobile
            ? "conditions.reward.placeholderShort"
            : "conditions.reward.placeholder",
        )}
        autoComplete="off"
        inputMode="numeric"
        aria-describedby="conditions-reward-help"
        value={reward === null ? "" : formatNumber(reward)}
        onChange={(event) =>
          patchConditions({
            rewardPerInfluencer: parseNumberInput(event.target.value),
          })
        }
      />
      <p
        id="conditions-reward-help"
        className="text-sm leading-5 text-muted-foreground"
      >
        {limit
          ? t("conditions.reward.helpWithMax", { amount: formatNumber(limit) })
          : t("conditions.reward.help")}
      </p>
    </div>
  );
}
