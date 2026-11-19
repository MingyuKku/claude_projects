import { CAMPAIGN_ADD_ONS } from "@/entities/campaign";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { formatNumber, formatNumericDate, useTranslation } from "@/shared/i18n";
import { fromIsoDate } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";

import { CAMPAIGN_TYPE_LABEL_KEYS } from "../../model/campaign-type-labels";
import { PLATFORM_ICON_NAMES, PLATFORM_LABEL_KEYS } from "../../model/platform";
import { needsTitleHashtags } from "../../model/step-completion";
import { DetailProductSection } from "./DetailProductSection";
import { DetailRow, DetailSection, StatusBadge } from "./DetailSection";

import type { CampaignDetail } from "@/entities/campaign";
import type { CampaignRegisterStep } from "@/entities/campaign";

/** 반려 상태에서 "수정"이 붙는 섹션(4·7·8번은 결제 금액·동의·결제라 잠금). */
const EDITABLE_STEP_BY_SECTION = {
  1: "campaign-info",
  2: "product",
  3: "creator",
  5: "intro",
  6: "conditions",
} as const satisfies Partial<Record<number, CampaignRegisterStep>>;

interface DetailSectionsProps {
  detail: CampaignDetail;
  /** 넘기면 1·2·3·5·6번에 "수정"을 붙임(반려 상태). */
  onEditStep?: (step: CampaignRegisterStep) => void;
}

function formatDateText(value: string | null) {
  const date = fromIsoDate(value?.slice(0, 10) ?? null);
  return date ? formatNumericDate(date) : "-";
}

export function DetailSections({ detail, onEditStep }: DetailSectionsProps) {
  const { t } = useTranslation("features/register-campaign");
  const { draft } = detail;
  const { info, creator, intro, conditions, policy } = draft;

  const won = (amount: number | null) =>
    amount === null ? "-" : t("payment.won", { amount: formatNumber(amount) });
  const editHandler = (section: keyof typeof EDITABLE_STEP_BY_SECTION) =>
    onEditStep && (() => onEditStep(EDITABLE_STEP_BY_SECTION[section]));
  const typeLabel = info.campaignType
    ? t(CAMPAIGN_TYPE_LABEL_KEYS[info.campaignType])
    : (detail.rawCampaignType ?? "-");
  const hashtagRows = needsTitleHashtags(creator.platform)
    ? [
        { key: "title" as const, values: intro.titleHashtags },
        { key: "content" as const, values: intro.contentHashtags },
      ]
    : [{ key: "content" as const, values: intro.contentHashtags }];
  const isPolicyAgreed = Object.values(policy).every(Boolean);
  const images = [intro.mainImage, ...intro.detailMedia].filter(
    (media) => media !== null,
  );

  return (
    <>
      <DetailSection
        number={1}
        title={t("detail.section.info")}
        onClickEdit={editHandler(1)}
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

      <DetailProductSection
        detail={detail}
        typeLabel={typeLabel}
        onClickEdit={editHandler(2)}
      />

      <DetailSection
        number={3}
        title={t("detail.section.creator")}
        onClickEdit={editHandler(3)}
      >
        <DetailRow label={t("detail.creator.platform")}>
          {creator.platform ? (
            <span className="flex items-center gap-2">
              <PlatformIcon
                platform={PLATFORM_ICON_NAMES[creator.platform]}
                className="size-6"
              />
              {t(PLATFORM_LABEL_KEYS[creator.platform])}
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
            .map((topic) => t(`creator.topic.${topic}`))
            .join(", ") || "-"}
        </DetailRow>
      </DetailSection>

      <DetailSection number={4} title={t("detail.section.addOns")}>
        {CAMPAIGN_ADD_ONS.map((addOn) => {
          const isApplied = draft.addOns.includes(addOn);
          return (
            <DetailRow key={addOn} label={t(`addOns.${addOn}.name`)}>
              <StatusBadge isPositive={isApplied}>
                {t(
                  isApplied
                    ? "detail.addOns.applied"
                    : "detail.addOns.notApplied",
                )}
              </StatusBadge>
            </DetailRow>
          );
        })}
      </DetailSection>

      <DetailSection
        number={5}
        title={t("detail.section.intro")}
        onClickEdit={editHandler(5)}
      >
        <DetailRow label={t("intro.description.label")} isWide>
          <span className="whitespace-pre-line">
            {intro.description || "-"}
          </span>
        </DetailRow>
        <DetailRow label={t("intro.notice.label")} isWide>
          <span className="whitespace-pre-line">{intro.notice || "-"}</span>
        </DetailRow>
        {hashtagRows.map(({ key, values }) => (
          <DetailRow key={key} label={t(`detail.intro.hashtag.${key}`)} isWide>
            {values.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {values.map((keyword) => (
                  <li
                    key={keyword}
                    className="inline-flex h-7 items-center rounded-md bg-secondary px-4 ds-text-xs-4-medium text-primary"
                  >
                    {keyword}
                  </li>
                ))}
              </ul>
            ) : (
              "-"
            )}
          </DetailRow>
        ))}
        <DetailRow label={t("detail.intro.images")} isWide>
          {images.length === 0 && "-"}
          <ul className="flex flex-wrap gap-2">
            {images.map((media, index) => (
              <li
                key={`${media.attachmentIdx ?? media.url}-${index}`}
                className="relative size-20 overflow-hidden rounded-md border"
              >
                {media.mediaType === "VIDEO" ? (
                  <video
                    src={media.url}
                    muted
                    preload="metadata"
                    className="size-full object-cover"
                  />
                ) : (
                  <img
                    src={media.url}
                    alt=""
                    className="size-full object-cover"
                  />
                )}
                {index === 0 && intro.mainImage && (
                  <Badge
                    size="sm"
                    variant="gray"
                    className="absolute top-1 left-1"
                  >
                    {t("detail.intro.mainBadge")}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </DetailRow>
      </DetailSection>

      <DetailSection
        number={6}
        title={t("detail.section.conditions")}
        onClickEdit={editHandler(6)}
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

      <DetailSection number={7} title={t("detail.section.policy")}>
        <DetailRow label={t("detail.policy.required")}>
          {isPolicyAgreed ? (
            <StatusBadge isPositive>{t("detail.policy.allAgreed")}</StatusBadge>
          ) : (
            "-"
          )}
        </DetailRow>
      </DetailSection>

      {detail.payment && (
        <DetailSection number={8} title={t("detail.section.payment")}>
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
      )}
    </>
  );
}
