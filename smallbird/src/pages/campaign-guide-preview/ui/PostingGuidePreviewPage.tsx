import { useParams } from "react-router";

import { parseCampaignIdx } from "@/entities/campaign";
import { usePostingGuidePreview } from "@/entities/campaign-progress";
import { SubHeader } from "@/shared/components/app-header";
import { Inform } from "@/shared/components/inform";
import { ScrollPanel } from "@/shared/components/scroll-panel";
import { SkeletonGroup } from "@/shared/components/skeleton-presets";
import { useTranslation } from "@/shared/i18n";
import { NotFoundError } from "@/shared/lib";
import { Skeleton } from "@/shared/ui/skeleton";

import {
  BasicConditionSection,
  CampaignInfoSection,
  ExamplesSection,
} from "./PreviewSections";

// 포스팅 가이드 미리보기(시안 14165:272496): 가이드 작성 화면의 "미리보기"가 새 탭으로 엶.
// 정보 확인용이라 닫기·버튼이 없음(시안 캡션 14165:273313). 저장된 값만 보여 줌.
export function PostingGuidePreviewPage() {
  const { t } = useTranslation("pages/campaign-guide-preview");
  const params = useParams();
  const campaignIdx = parseCampaignIdx(params.campaignIdx);
  if (campaignIdx === null) throw new NotFoundError();

  return (
    <div className="flex h-dvh flex-col bg-muted/40">
      <title>{t("title")}</title>
      <SubHeader
        className="bg-background"
        title={<h1 className="truncate">{t("title")}</h1>}
      />
      <ScrollPanel className="flex-1">
        <main className="mx-auto flex min-h-full w-full max-w-296 flex-col gap-5 bg-background px-4 py-4 tablet:ds-p-5">
          <Inform
            items={[{ id: "notice", text: t("notice") }]}
            className="w-full"
          />
          <PreviewBody campaignIdx={campaignIdx} />
        </main>
      </ScrollPanel>
    </div>
  );
}

function PreviewBody({ campaignIdx }: { campaignIdx: number }) {
  const { preview, error } = usePostingGuidePreview(campaignIdx);
  if (error) throw error;
  if (!preview) {
    return (
      <SkeletonGroup className="flex flex-col gap-5">
        <Skeleton className="h-64 rounded-md" />
        <Skeleton className="h-96 rounded-md" />
      </SkeletonGroup>
    );
  }

  return (
    <>
      <CampaignInfoSection preview={preview} />
      <BasicConditionSection preview={preview} />
      <ExamplesSection preview={preview} />
    </>
  );
}
