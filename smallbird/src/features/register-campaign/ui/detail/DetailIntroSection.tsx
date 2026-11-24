import { useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";

import { needsTitleHashtags } from "../../model/step-completion";
import { DetailRow, DetailSection } from "./DetailSection";

import type { CampaignDetail } from "@/entities/campaign";

interface DetailIntroSectionProps {
  number: number;
  detail: CampaignDetail;
  onClickEdit?: () => void;
}

export function DetailIntroSection({
  number,
  detail,
  onClickEdit,
}: DetailIntroSectionProps) {
  const { t } = useTranslation("features/register-campaign");
  const { creator, intro } = detail.draft;
  const hashtagRows = needsTitleHashtags(creator.platform)
    ? [
        { key: "title" as const, values: intro.titleHashtags },
        { key: "content" as const, values: intro.contentHashtags },
      ]
    : [{ key: "content" as const, values: intro.contentHashtags }];
  const images = [intro.mainImage, ...intro.detailMedia].filter(
    (media) => media !== null,
  );

  return (
    <DetailSection
      number={number}
      title={t("detail.section.intro")}
      onClickEdit={onClickEdit}
    >
      <DetailRow label={t("intro.description.label")} isWide>
        <span className="whitespace-pre-line">{intro.description || "-"}</span>
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
  );
}
