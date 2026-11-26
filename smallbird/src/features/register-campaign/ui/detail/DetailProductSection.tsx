import { formatNumber, useTranslation } from "@/shared/i18n";

import { DetailRow, DetailSection, StatusBadge } from "./DetailSection";

import type { CampaignAddress, CampaignDetail } from "@/entities/campaign";

interface DetailProductSectionProps {
  number?: number;
  detail: CampaignDetail;
  /** 캠페인 유형 표시 문구(협찬 유형). */
  typeLabel: string;
  onClickEdit?: () => void;
}

function formatAddress(address: CampaignAddress | null) {
  if (!address) return "-";
  return [address.address, address.detail].filter(Boolean).join(" ");
}

// 매장방문형 시안의 "방문 안내 및 유의사항"은 입력 칸이 없어 그리지 않음.
export function DetailProductSection({
  number,
  detail,
  typeLabel,
  onClickEdit,
}: DetailProductSectionProps) {
  const { t } = useTranslation("features/register-campaign");
  const { info, product } = detail.draft;

  const won = (amount: number | null) =>
    amount === null ? "-" : t("payment.won", { amount: formatNumber(amount) });

  return (
    <DetailSection
      number={number}
      title={t("detail.section.product")}
      onClickEdit={onClickEdit}
    >
      <DetailRow label={t("detail.product.type")}>{typeLabel}</DetailRow>
      {info.campaignType === "PRODUCT_DELIVERY" && (
        <>
          <DetailRow label={t("detail.product.nameAndQuantity")}>
            {product.productName
              ? t("detail.product.nameAndQuantityValue", {
                  name: product.productName,
                  count: product.quantityPerCreator ?? 0,
                })
              : "-"}
          </DetailRow>
          <DetailRow label={t("detail.product.price")}>
            {won(product.productPrice)}
          </DetailRow>
          <DetailRow label={t("detail.product.returnRequired")}>
            <StatusBadge isPositive={product.returnRequired}>
              {t(
                product.returnRequired
                  ? "detail.product.returned"
                  : "detail.product.notReturned",
              )}
            </StatusBadge>
          </DetailRow>
          {product.returnRequired && (
            <>
              <DetailRow label={t("detail.product.returnFee")}>
                {won(product.returnShippingFee)}
              </DetailRow>
              <DetailRow label={t("detail.product.returnContact")}>
                {product.returnContact || "-"}
              </DetailRow>
              <DetailRow label={t("detail.product.returnAddress")} isWide>
                {formatAddress(product.returnAddress)}
              </DetailRow>
            </>
          )}
          {product.rental && (
            <>
              <DetailRow label={t("detail.product.rentalReturn")}>
                <StatusBadge isPositive>
                  {t("detail.product.returned")}
                </StatusBadge>
              </DetailRow>
              <DetailRow label={t("detail.product.rentalFee")}>
                {won(product.rentalReturnShippingFee)}
              </DetailRow>
              <DetailRow label={t("detail.product.rentalContact")}>
                {product.rentalReturnContact || "-"}
              </DetailRow>
              <DetailRow label={t("detail.product.rentalAddress")} isWide>
                {formatAddress(product.rentalReturnAddress)}
              </DetailRow>
            </>
          )}
        </>
      )}
      {info.campaignType === "STORE_VISIT" && (
        <>
          <DetailRow label={t("detail.product.coupon")}>
            {product.visitCouponCode || "-"}
          </DetailRow>
          <DetailRow label={t("detail.product.storeName")}>
            {product.storeName || "-"}
          </DetailRow>
          <DetailRow label={t("detail.product.storeAddress")} isWide>
            {formatAddress(product.storeAddress)}
          </DetailRow>
          <DetailRow label={t("detail.product.benefit")} isWide>
            <span className="whitespace-pre-line">
              {product.visitBenefit || "-"}
            </span>
          </DetailRow>
        </>
      )}
    </DetailSection>
  );
}
