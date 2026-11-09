import { formatNumber, useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";

import { useCampaignLabels } from "../../../model/use-campaign-labels";
import {
  SummaryField,
  SummaryFieldGrid,
  SummarySection,
} from "../SummarySection";

import type { CampaignDetail } from "../../../model/schema";

function formatAddress(
  address: CampaignDetail["product"]["storeAddress"],
): string {
  if (!address) return "-";
  return [address.address, address.detail].filter(Boolean).join(" ");
}

// 2 제품 정보: 협찬 유형에 따라 항목이 다름(스펙: 섹션명은 "제품 정보"로 통일).
// 제품발송형 금액·제품·회수 여부, 매장방문형 쿠폰·매장·주소·혜택, 구매리뷰형 링크·제품명·(모집형)금액·안내, 기자단형은 유형만 있음.
export function ProductSection({
  campaign,
  id,
}: {
  campaign: CampaignDetail;
  id: string;
}) {
  const { t } = useTranslation("entities/campaign");
  const labels = useCampaignLabels();
  const { product } = campaign;
  const { campaignType } = campaign.campaignInfo;
  const won = (amount: number | null) =>
    amount === null ? "-" : t("summary.won", { amount: formatNumber(amount) });

  return (
    <SummarySection id={id} number={2} title={t("summary.product.title")}>
      {campaignType === "PRODUCT_DELIVERY" && (
        <SummaryFieldGrid>
          <SummaryField label={t("summary.product.type")}>
            {labels.campaignType(campaignType)}
          </SummaryField>
          <SummaryField label={t("summary.product.delivery")}>
            {product.productName
              ? t("summary.product.deliveryValue", {
                  name: product.productName,
                  count: product.quantityPerInfluencer ?? 0,
                })
              : "-"}
          </SummaryField>
          <SummaryField label={t("summary.product.price")}>
            {won(product.productPrice)}
          </SummaryField>
          <SummaryField label={t("summary.product.returnStatus")}>
            <span className="flex flex-wrap gap-1">
              <Badge variant="gray" size="sm">
                {t(
                  product.returnRequired
                    ? "summary.product.returnRequired"
                    : "summary.product.returnNone",
                )}
              </Badge>
              {product.rental && (
                <Badge variant="gray" size="sm">
                  {t("summary.product.rental")}
                </Badge>
              )}
            </span>
          </SummaryField>
        </SummaryFieldGrid>
      )}
      {campaignType === "STORE_VISIT" && (
        <>
          <SummaryFieldGrid>
            <SummaryField label={t("summary.product.type")}>
              {labels.campaignType(campaignType)}
            </SummaryField>
            <SummaryField label={t("summary.product.storeName")}>
              {product.storeName ?? "-"}
            </SummaryField>
            <SummaryField label={t("summary.product.couponCode")}>
              {product.visitCouponCode ?? "-"}
            </SummaryField>
            <SummaryField label={t("summary.product.storeAddress")}>
              {formatAddress(product.storeAddress)}
            </SummaryField>
          </SummaryFieldGrid>
          <SummaryField label={t("summary.product.benefit")}>
            {product.visitBenefit ?? "-"}
          </SummaryField>
        </>
      )}
      {campaignType === "PURCHASE_REVIEW" && (
        <>
          <SummaryFieldGrid>
            <SummaryField label={t("summary.product.type")}>
              {labels.campaignType(campaignType)}
            </SummaryField>
            <SummaryField label={t("summary.product.purchaseName")}>
              {product.productName ?? "-"}
            </SummaryField>
            <SummaryField label={t("summary.product.purchaseUrl")}>
              {product.purchaseUrl ?? "-"}
            </SummaryField>
            {campaign.serviceType === "RECRUIT" && (
              <SummaryField label={t("summary.product.purchasePrice")}>
                {won(product.purchasePrice)}
              </SummaryField>
            )}
          </SummaryFieldGrid>
          <SummaryField label={t("summary.product.purchaseGuide")}>
            {product.purchaseGuide ?? "-"}
          </SummaryField>
        </>
      )}
      {campaignType !== "PRODUCT_DELIVERY" &&
        campaignType !== "STORE_VISIT" &&
        campaignType !== "PURCHASE_REVIEW" && (
          <SummaryField label={t("summary.product.type")}>
            {campaignType ? labels.campaignType(campaignType) : "-"}
          </SummaryField>
        )}
    </SummarySection>
  );
}
