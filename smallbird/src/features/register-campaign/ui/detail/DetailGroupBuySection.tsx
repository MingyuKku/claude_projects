import { useProductCategories } from "@/entities/campaign";
import { formatNumber, useTranslation } from "@/shared/i18n";

import { DetailRow, DetailSection } from "./DetailSection";

import type { CampaignDetail } from "@/entities/campaign";

interface DetailGroupBuySectionProps {
  number?: number;
  detail: CampaignDetail;
  onClickEdit?: () => void;
}

// 분류 이름은 서버 목록에서 번호로 찾아 보여 줌.
export function DetailGroupBuySection({
  number,
  detail,
  onClickEdit,
}: DetailGroupBuySectionProps) {
  const { t } = useTranslation("features/register-campaign");
  const { categories } = useProductCategories();
  const { groupBuy } = detail.draft;

  const won = (amount: number | null) =>
    amount === null ? "-" : t("payment.won", { amount: formatNumber(amount) });
  const category = categories?.find(
    (item) => item.idx === groupBuy.categoryIdx,
  );
  const middleCategory = category?.children.find(
    (item) => item.idx === groupBuy.middleCategoryIdx,
  );

  return (
    <DetailSection
      number={number}
      title={t("detail.section.groupBuy")}
      onClickEdit={onClickEdit}
    >
      <DetailRow label={t("groupBuy.productName.label")}>
        {groupBuy.productName || "-"}
      </DetailRow>
      <DetailRow label={t("groupBuy.category.label")}>
        {category?.name ?? "-"}
      </DetailRow>
      <DetailRow label={t("groupBuy.middleCategory.label")}>
        {middleCategory?.name ?? "-"}
      </DetailRow>
      <DetailRow label={t("groupBuy.recommendedPrice.label")}>
        {won(groupBuy.recommendedPrice)}
      </DetailRow>
      <DetailRow label={t("groupBuy.price.label")}>
        {won(groupBuy.price)}
      </DetailRow>
    </DetailSection>
  );
}
