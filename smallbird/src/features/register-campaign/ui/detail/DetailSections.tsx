import { Fragment } from "react";

import { POSTING_GUIDE_PRICE } from "@/entities/campaign";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { formatNumber, formatNumericDate, useTranslation } from "@/shared/i18n";
import { fromIsoDate } from "@/shared/lib";

import { getAvailableAddOns } from "../../model/add-ons";
import { CAMPAIGN_TYPE_LABEL_KEYS } from "../../model/campaign-type-labels";
import { getPlatformLabelKey, PLATFORM_ICON_NAMES } from "../../model/platform";
import { getTopicLabelKey } from "../../model/topics";
import { DetailGroupBuySection } from "./DetailGroupBuySection";
import { DetailIntroSection } from "./DetailIntroSection";
import { DetailProductSection } from "./DetailProductSection";
import { DetailRow, DetailSection, StatusBadge } from "./DetailSection";

import type {
  CampaignDetail,
  CampaignProductType,
  CampaignRegisterStep,
} from "@/entities/campaign";
import type { ReactNode } from "react";

type SectionKey =
  | "info"
  | "product"
  | "creator"
  | "groupBuy"
  | "addOns"
  | "intro"
  | "conditions"
  | "policy"
  | "payment";

/** 상품 유형별 섹션 순서. 번호는 이 순서대로 매김(결제 정보는 결제한 뒤에만 붙음). */
const SECTION_ORDER: Record<CampaignProductType, readonly SectionKey[]> = {
  BRAND: [
    "info",
    "product",
    "creator",
    "conditions",
    "intro",
    "addOns",
    "policy",
    "payment",
  ],
  GROUP_BUY: [
    "info",
    "product",
    "creator",
    "groupBuy",
    "intro",
    "addOns",
    "policy",
    "payment",
  ],
};

/** 반려 상태에서 "수정"이 붙는 섹션(부가서비스·정책 동의·결제는 금액·동의·결제라 잠금). */
const EDITABLE_STEP_BY_SECTION = {
  info: "campaign-info",
  product: "product",
  creator: "creator",
  groupBuy: "group-buy",
  intro: "intro",
  conditions: "conditions",
} as const satisfies Partial<Record<SectionKey, CampaignRegisterStep>>;

interface DetailSectionsProps {
  detail: CampaignDetail;
  /** 넘기면 수정할 수 있는 섹션에 "수정"을 붙임(반려 상태). */
  onEditStep?: (step: CampaignRegisterStep) => void;
  /** false면 섹션 번호를 빼고 제목을 크게 보임(캠페인 진행 기본정보). */
  isNumbered?: boolean;
}

function formatDateText(value: string | null) {
  const date = fromIsoDate(value?.slice(0, 10) ?? null);
  return date ? formatNumericDate(date) : "-";
}

export function DetailSections({
  detail,
  onEditStep,
  isNumbered = true,
}: DetailSectionsProps) {
  const { t } = useTranslation("features/register-campaign");
  const { draft } = detail;
  const { info, creator, conditions, policy } = draft;
  const productType = detail.productType ?? "BRAND";

  const won = (amount: number | null) =>
    amount === null ? "-" : t("payment.won", { amount: formatNumber(amount) });
  const editHandler = (section: keyof typeof EDITABLE_STEP_BY_SECTION) =>
    onEditStep && (() => onEditStep(EDITABLE_STEP_BY_SECTION[section]));
  const typeLabel = info.campaignType
    ? t(CAMPAIGN_TYPE_LABEL_KEYS[info.campaignType])
    : (detail.rawCampaignType ?? "-");
  const isPolicyAgreed = Object.values(policy).every(Boolean);
  const addOnAppliedLabel =
    productType === "GROUP_BUY"
      ? t("detail.addOns.appliedWithPrice", {
          amount: formatNumber(POSTING_GUIDE_PRICE),
        })
      : t("detail.addOns.applied");

  const renderers: Record<SectionKey, (number?: number) => ReactNode> = {
    info: (number) => (
      <DetailSection
        number={number}
        title={t("detail.section.info")}
        onClickEdit={editHandler("info")}
      >
        <DetailRow label={t("detail.info.name")}>{info.name || "-"}</DetailRow>
        <DetailRow label={t("detail.info.code")}>
          {detail.campaignCode}
        </DetailRow>
        <DetailRow label={t("detail.info.type")}>{typeLabel}</DetailRow>
        <DetailRow label={t("detail.info.brand")}>
          {detail.brand?.name ?? "-"}
        </DetailRow>
        <DetailRow label={t("detail.info.period")}>
          {info.startDate
            ? `${formatDateText(info.startDate)} - ${formatDateText(detail.endDate)}`
            : "-"}
        </DetailRow>
        <DetailRow label={t("detail.info.brandImage")}>
          {detail.brand?.logoUrl ? (
            <img
              src={detail.brand.logoUrl}
              alt=""
              className="size-20 rounded-md border object-cover"
            />
          ) : (
            "-"
          )}
        </DetailRow>
      </DetailSection>
    ),
    product: (number) => (
      <DetailProductSection
        number={number}
        detail={detail}
        typeLabel={typeLabel}
        onClickEdit={editHandler("product")}
      />
    ),
    creator: (number) => (
      <DetailSection
        number={number}
        title={t("detail.section.creator")}
        onClickEdit={editHandler("creator")}
      >
        <DetailRow label={t("detail.creator.platform")}>
          {creator.platform ? (
            <span className="flex items-center gap-2">
              <PlatformIcon
                platform={PLATFORM_ICON_NAMES[creator.platform]}
                className="size-6"
              />
              {t(getPlatformLabelKey(creator.platform, productType))}
            </span>
          ) : (
            "-"
          )}
        </DetailRow>
        <DetailRow label={t("detail.creator.ageGroups")}>
          {creator.ageGroups
            .map((age) => t(`creator.ageGroup.${age}`))
            .join(", ") || "-"}
        </DetailRow>
        <DetailRow label={t("detail.creator.gender")}>
          {creator.gender ? t(`creator.gender.${creator.gender}`) : "-"}
        </DetailRow>
        <DetailRow label={t("detail.creator.topics")}>
          {creator.topics
            .map((topic) => t(getTopicLabelKey(topic, productType)))
            .join(", ") || "-"}
        </DetailRow>
      </DetailSection>
    ),
    groupBuy: (number) => (
      <DetailGroupBuySection
        number={number}
        detail={detail}
        onClickEdit={editHandler("groupBuy")}
      />
    ),
    addOns: (number) => (
      <DetailSection number={number} title={t("detail.section.addOns")}>
        {getAvailableAddOns(productType).map((addOn) => {
          const isApplied = draft.addOns.includes(addOn);
          return (
            <DetailRow key={addOn} label={t(`addOns.${addOn}.name`)}>
              <StatusBadge isPositive={isApplied}>
                {isApplied ? addOnAppliedLabel : t("detail.addOns.notApplied")}
              </StatusBadge>
            </DetailRow>
          );
        })}
      </DetailSection>
    ),
    intro: (number) => (
      <DetailIntroSection
        number={number}
        detail={detail}
        onClickEdit={editHandler("intro")}
      />
    ),
    conditions: (number) => (
      <DetailSection
        number={number}
        title={t("detail.section.conditions")}
        onClickEdit={editHandler("conditions")}
      >
        <DetailRow label={t("detail.conditions.period")}>
          {conditions.postingPeriodMonths === null
            ? "-"
            : t("detail.conditions.periodValue", {
                count: conditions.postingPeriodMonths,
              })}
        </DetailRow>
        <DetailRow label={t("detail.conditions.copyright")}>
          {conditions.secondaryCopyright === null ? (
            "-"
          ) : (
            <StatusBadge isPositive={conditions.secondaryCopyright}>
              {t(
                conditions.secondaryCopyright
                  ? "detail.conditions.copyrightUsed"
                  : "conditions.copyright.notUse",
              )}
            </StatusBadge>
          )}
        </DetailRow>
      </DetailSection>
    ),
    policy: (number) => (
      <DetailSection number={number} title={t("detail.section.policy")}>
        <DetailRow label={t("detail.policy.required")}>
          {isPolicyAgreed ? (
            <StatusBadge isPositive>{t("detail.policy.allAgreed")}</StatusBadge>
          ) : (
            "-"
          )}
        </DetailRow>
      </DetailSection>
    ),
    payment: (number) =>
      detail.payment && (
        <DetailSection number={number} title={t("detail.section.payment")}>
          <DetailRow label={t("detail.payment.amount")}>
            {won(detail.payment.paidAmount)}
          </DetailRow>
          <DetailRow label={t("detail.payment.method")}>
            {t("detail.payment.methodValue")}
          </DetailRow>
          <DetailRow label={t("detail.payment.paidAt")}>
            {formatDateText(detail.payment.paidAt)}
          </DetailRow>
        </DetailSection>
      ),
  };

  return (
    <>
      {SECTION_ORDER[productType].map((key, index) => (
        <Fragment key={key}>
          {renderers[key](isNumbered ? index + 1 : undefined)}
        </Fragment>
      ))}
    </>
  );
}
