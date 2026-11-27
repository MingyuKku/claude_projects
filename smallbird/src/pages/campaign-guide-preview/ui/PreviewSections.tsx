import { Image, Video } from "lucide-react";

import { DetailRow } from "@/features/register-campaign";
import { CountCard } from "@/shared/components/cards";
import { useTranslation } from "@/shared/i18n";

import type { PostingGuidePreview } from "@/entities/campaign-progress";
import type { ReactNode } from "react";

// 미리보기 묶음(시안 Campaign Information·Basic Requirements·Media Examples): 테두리 카드 + 제목.
function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-md border border-border bg-background p-3.75">
      <h2 className="ds-text-sm-none-semibold">{title}</h2>
      {children}
    </section>
  );
}

// 칩(시안 Button xs Secondary, 눌리지 않는 표시).
function ChipList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="inline-flex h-7 items-center rounded-md bg-secondary px-2 ds-text-xs-4-medium text-primary"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function CampaignInfoSection({
  preview,
}: {
  preview: PostingGuidePreview;
}) {
  const { t } = useTranslation("pages/campaign-guide-preview");

  // PC는 두 열(왼쪽 이름·유형·기간, 오른쪽 코드·브랜드), TAB·MO는 한 열로 같은 순서.
  return (
    <PreviewSection title={t("campaign.title")}>
      <div className="flex flex-col desktop:flex-row desktop:gap-4">
        <dl className="flex min-w-0 flex-1 flex-col">
          <DetailRow label={t("campaign.name")}>
            {preview.campaignName}
          </DetailRow>
          <DetailRow label={t("campaign.type")}>
            {preview.campaignType ?? "-"}
          </DetailRow>
          <DetailRow label={t("campaign.period")}>
            {preview.period ?? "-"}
          </DetailRow>
        </dl>
        <dl className="flex min-w-0 flex-1 flex-col">
          <DetailRow label={t("campaign.code")}>
            {preview.campaignCode}
          </DetailRow>
          <DetailRow label={t("campaign.brandName")}>
            {preview.brandName ?? "-"}
          </DetailRow>
          <DetailRow label={t("campaign.brandImage")}>
            {preview.brandImageUrl ? (
              <img
                src={preview.brandImageUrl}
                alt={preview.brandName ?? ""}
                className="size-20 rounded-md border border-border object-cover"
              />
            ) : (
              "-"
            )}
          </DetailRow>
        </dl>
      </div>
    </PreviewSection>
  );
}

export function BasicConditionSection({
  preview,
}: {
  preview: PostingGuidePreview;
}) {
  const { t } = useTranslation("pages/campaign-guide-preview");
  const { basicCondition } = preview.guide;

  return (
    <PreviewSection title={t("basic.title")}>
      {/* 시안의 카드 3개 중 포스팅 수는 입력이 빠져(11/19) 사진·영상 두 개만 둠(사용자 2026-11-27). */}
      <div className="grid grid-cols-2 gap-4 desktop:grid-cols-3">
        <CountCard
          icon={<Image aria-hidden className="size-4" />}
          title={t("basic.photoCount")}
          value={basicCondition.minPhotoCount ?? "-"}
          unit={
            basicCondition.minPhotoCount === null ? null : t("basic.photoUnit")
          }
        />
        <CountCard
          icon={<Video aria-hidden className="size-4" />}
          title={t("basic.videoCount")}
          value={basicCondition.minVideoCount ?? "-"}
          unit={
            basicCondition.minVideoCount === null ? null : t("basic.videoUnit")
          }
        />
      </div>
      <dl className="flex flex-col">
        <DetailRow label={t("basic.keywords")}>
          <ChipList items={basicCondition.requiredKeywords} />
        </DetailRow>
        <DetailRow label={t("basic.hashtags")}>
          <ChipList items={basicCondition.requiredHashtags} />
        </DetailRow>
        {/* 유의사항·참고 URL은 선택 항목이라 비었으면 행을 숨김(시안 캡션 14165:273339). */}
        {basicCondition.notice && (
          <DetailRow label={t("basic.notice")}>
            <p className="whitespace-pre-line">{basicCondition.notice}</p>
          </DetailRow>
        )}
        {basicCondition.referenceUrls.length > 0 && (
          <DetailRow label={t("basic.referenceUrl")}>
            <ul className="flex flex-col gap-7">
              {basicCondition.referenceUrls.map((url) => (
                <li key={url} className="break-all">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </DetailRow>
        )}
      </dl>
    </PreviewSection>
  );
}

// 예시 카드는 파일 주소가 응답에 생긴 뒤(백엔드 요청 B-20) 붙임. 지금은 콘텐츠 개요만.
export function ExamplesSection({ preview }: { preview: PostingGuidePreview }) {
  const { t } = useTranslation("pages/campaign-guide-preview");
  if (!preview.guide.contentGuide) return null;

  return (
    <PreviewSection title={t("examples.title")}>
      <dl className="flex flex-col">
        <DetailRow label={t("examples.contentGuide")}>
          <p className="whitespace-pre-line">{preview.guide.contentGuide}</p>
        </DetailRow>
      </dl>
    </PreviewSection>
  );
}
