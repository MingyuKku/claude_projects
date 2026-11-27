import { PenLine, WandSparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  getPostingGuidePreviewPath,
  usePostingGuide,
  usePostingGuidePayment,
} from "@/entities/campaign-progress";
import { ChoiceCardGroup } from "@/shared/components/choice-card-group";
import { ScrollPanel } from "@/shared/components/scroll-panel";
import { useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { usePostingGuideForm } from "../model/use-posting-guide-form";
import { BasicConditionPanel } from "./BasicConditionPanel";
import { ExamplesPanel } from "./ExamplesPanel";
import {
  GuideActionBar,
  GuideMobileActionBar,
  GuideMobileHeaderActions,
} from "./GuideActionBar";
import { GuideDialogs } from "./GuideDialogs";
import { PostingGuideSkeleton } from "./PostingGuideSkeleton";

import type { GuideActionState } from "./GuideActionBar";
import type { GuideDialog } from "./GuideDialogs";
import type {
  PostingGuide,
  PostingGuideMethod,
} from "@/entities/campaign-progress";
import type { ReactNode } from "react";

interface PostingGuideStepProps {
  campaignIdx: number;
  /** 종료된 캠페인: 조회만(REQ-14-0010). */
  isReadOnly: boolean;
  /** MO 서브 헤더. 오른쪽 버튼(건너뛰기·미리보기)을 받아 그림. */
  renderMobileHeader: (actions: ReactNode) => ReactNode;
  /** 건너뛴 뒤 다음 진행 단계로 감(기획 2026-11-27). */
  onSkipped: () => void;
}

// 캠페인 진행 1단계 포스팅 가이드(스펙 campaign/progress §1): 방식 카드, 기본 조건, 예시 탭의 콘텐츠 개요, 미리보기(새 탭).
// 예시 카드는 파일 주소·업로드 API 답(B-20·B-21) 뒤에 붙임. AI 생성·AI 결제는 준비 중(서버가 아직 임시 문구만 채움).
export function PostingGuideStep({
  campaignIdx,
  isReadOnly,
  renderMobileHeader,
  onSkipped,
}: PostingGuideStepProps) {
  const { guide, error, mutate } = usePostingGuide(campaignIdx);
  const { payment, error: paymentError } = usePostingGuidePayment(campaignIdx);

  if (error) throw error;
  // 결제 상태를 못 읽으면 미결제로 보고 직접 작성으로 시작함(AI는 어차피 준비 중).
  const isPaymentReady = payment !== undefined || paymentError !== undefined;
  if (guide === undefined || !isPaymentReady) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {renderMobileHeader(null)}
        <PostingGuideSkeleton />
      </div>
    );
  }

  return (
    <PostingGuideEditor
      campaignIdx={campaignIdx}
      guide={guide}
      isAiPaid={payment?.isPaid ?? false}
      isReadOnly={isReadOnly}
      renderMobileHeader={renderMobileHeader}
      onSkipped={onSkipped}
      onSaved={(saved) => void mutate(saved, { revalidate: false })}
      onFailed={() => void mutate()}
    />
  );
}

interface PostingGuideEditorProps extends Omit<
  PostingGuideStepProps,
  "campaignIdx"
> {
  campaignIdx: number;
  guide: PostingGuide | null;
  isAiPaid: boolean;
  onSaved: (guide: PostingGuide) => void;
  onFailed: () => void;
}

function PostingGuideEditor({
  campaignIdx,
  guide,
  isAiPaid,
  isReadOnly,
  renderMobileHeader,
  onSkipped,
  onSaved,
  onFailed,
}: PostingGuideEditorProps) {
  const { t } = useTranslation("features/write-posting-guide");
  const { t: tCommon } = useTranslation();
  const form = usePostingGuideForm({
    campaignIdx,
    guide,
    isAiPaid,
    onSaved,
    onFailed,
  });
  const [dialog, setDialog] = useState<GuideDialog | null>(null);
  const isLocked = isReadOnly || guide?.status === "CONFIRMED";
  const paymentBadge = isAiPaid ? (
    <Badge size="sm">{t("method.inUse")}</Badge>
  ) : (
    <Badge size="sm" variant="gray">
      {t("method.needsPayment")}
    </Badge>
  );

  function showComingSoon() {
    toast(tCommon("status.comingSoon"));
  }

  async function handleSaveDraft() {
    const isSaved = await form.saveDraft();
    toast(isSaved ? t("toast.saved") : t("toast.saveFailed"));
  }

  async function handleConfirm() {
    setDialog(null);
    if (!(await form.confirm())) toast(t("toast.saveFailed"));
  }

  async function handleSkip() {
    setDialog(null);
    if (await form.skip()) onSkipped();
    else toast(tCommon("error.unexpected"));
  }

  const actions: GuideActionState = {
    method: form.method,
    pending: form.pending,
    isLocked,
    isComplete: form.isComplete,
    onSkip: () => setDialog("skip"),
    // 저장된 내용을 새 탭에서 봄(시안: 별도 화면, 닫기·버튼 없음). 한 번도 저장 전이면 볼 것이 없어 막음.
    isPreviewDisabled: guide === null,
    onPreview: () =>
      window.open(
        getPostingGuidePreviewPath(campaignIdx),
        "_blank",
        "noopener",
      ),
    onSaveDraft: () => void handleSaveDraft(),
    onConfirm: () => setDialog("confirm"),
    onGenerateAi: showComingSoon,
  };

  const panel = (
    <BasicConditionPanel
      condition={form.condition}
      onChange={form.patch}
      hasTitle={form.method === "AI"}
      disabled={isLocked}
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {renderMobileHeader(<GuideMobileHeaderActions {...actions} />)}
      <ScrollPanel
        className="flex-1"
        contentClassName="flex flex-col gap-5 px-4 pt-1 pb-5 tablet:ds-p-5"
      >
        <div className="hidden items-center gap-2 tablet:flex">
          <h2 className="ds-text-base-none-semibold">{t("title")}</h2>
          {/* TAB은 카드가 좁아 결제 상태를 제목 옆에 둠(시안 14165:273751). */}
          <Badge
            size="sm"
            variant={isAiPaid ? "blue" : "gray"}
            className="desktop:hidden"
          >
            {isAiPaid ? t("method.serviceInUse") : t("method.needsPayment")}
          </Badge>
        </div>
        <ChoiceCardGroup
          label={t("method.label")}
          isLabelHidden
          isCompactOnMobile={false}
          value={form.method}
          onValueChange={(value) => {
            if (isGuideMethod(value)) form.setMethod(value);
          }}
          disabled={isLocked}
          className="gap-4 desktop:grid-cols-[repeat(2,--spacing(90.375))]"
          options={[
            {
              value: "AI",
              label: t("method.ai.title"),
              description: t("method.ai.description"),
              icon: <WandSparkles aria-hidden className="size-4 shrink-0" />,
              badge: (
                <span className="contents tablet:hidden desktop:contents">
                  {paymentBadge}
                </span>
              ),
            },
            {
              value: "MANUAL",
              label: t("method.manual.title"),
              description: t("method.manual.description"),
              icon: <PenLine aria-hidden className="size-4 shrink-0" />,
            },
          ]}
        />
        {form.method === "AI" ? (
          panel
        ) : (
          <Tabs defaultValue="basic" className="gap-5">
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="basic" className="flex-none">
                {t("tab.basic")}
              </TabsTrigger>
              <TabsTrigger value="examples" className="flex-none">
                {t("tab.examples")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="basic">{panel}</TabsContent>
            <TabsContent value="examples">
              <ExamplesPanel
                contentGuide={form.contentGuide}
                onChangeContentGuide={form.setContentGuide}
                disabled={isLocked}
              />
            </TabsContent>
          </Tabs>
        )}
      </ScrollPanel>
      <GuideActionBar {...actions} />
      <GuideMobileActionBar {...actions} />
      <GuideDialogs
        dialog={dialog}
        onClose={() => setDialog(null)}
        onSkip={() => void handleSkip()}
        onConfirm={() => void handleConfirm()}
      />
    </div>
  );
}

function isGuideMethod(value: string): value is PostingGuideMethod {
  return value === "AI" || value === "MANUAL";
}
