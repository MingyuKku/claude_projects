import { useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";

import { SummaryField, SummarySection } from "../SummarySection";

import type { CampaignDetail } from "../../../model/schema";

// 5 캠페인 소개서(PICK형·모집형 같음, 스펙 P-21 전까지): 작성 방식·설명·유의사항·해시태그·이미지 썸네일(첫 장은 "메인" 배지).
// 해시태그는 "필수 해시태그(키워드)" 한 줄이고 시안의 (제목)·(본문) 2종은 따르지 않음(스펙 D-7).
export function IntroSection({
  campaign,
  id,
}: {
  campaign: CampaignDetail;
  id: string;
}) {
  const { t } = useTranslation("entities/campaign");
  const { intro } = campaign;
  const images = [
    ...(intro.mainImage ? [{ file: intro.mainImage, isMain: true }] : []),
    ...intro.media.map((file) => ({ file, isMain: false })),
  ];

  return (
    <SummarySection id={id} number={5} title={t("summary.intro.title")}>
      <SummaryField label={t("summary.intro.mode")}>
        {intro.mode ? t(`summary.intro.modeValue.${intro.mode}`) : "-"}
      </SummaryField>
      <SummaryField label={t("summary.intro.description")}>
        {intro.description ?? "-"}
      </SummaryField>
      <SummaryField label={t("summary.intro.notice")}>
        {intro.notice ?? "-"}
      </SummaryField>
      <SummaryField label={t("summary.intro.hashtags")}>
        {intro.hashtags.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {intro.hashtags.map((tag, index) => (
              <li key={`${tag}-${index}`}>
                <span className="inline-flex rounded-lg bg-secondary px-3.5 py-1.5 text-xs leading-4 font-semibold text-blue-600">
                  {tag}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          "-"
        )}
      </SummaryField>
      <SummaryField label={t("summary.intro.images")} isStackedOnMobile>
        {images.length > 0 ? (
          <ul className="grid w-fit grid-cols-3 gap-2">
            {images.map(({ file, isMain }) => (
              <li
                key={file.fileId}
                className="relative size-19 overflow-hidden rounded-md border tablet:size-20"
              >
                <img
                  src={file.thumbnailUrl ?? file.url}
                  alt=""
                  className="size-full object-cover"
                />
                {isMain && (
                  <Badge
                    variant="gray"
                    size="sm"
                    className="absolute top-1 left-1"
                  >
                    {t("summary.intro.main")}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        ) : (
          "-"
        )}
      </SummaryField>
    </SummarySection>
  );
}
