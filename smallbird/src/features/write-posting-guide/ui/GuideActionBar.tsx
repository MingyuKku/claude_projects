import { WandSparkles } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import type { PendingGuideAction } from "../model/use-posting-guide-form";
import type { PostingGuideMethod } from "@/entities/campaign-progress";

export interface GuideActionState {
  method: PostingGuideMethod;
  pending: PendingGuideAction | null;
  /** 확정된 가이드·종료된 캠페인: 작성 동작을 모두 막음(미리보기는 둠). */
  isLocked: boolean;
  isComplete: boolean;
  isPreviewDisabled: boolean;
  onSkip: () => void;
  onPreview: () => void;
  onSaveDraft: () => void;
  onConfirm: () => void;
  onGenerateAi: () => void;
}

/** PC·TAB 하단 바(시안 14165:272908·14165:273799): 왼쪽 건너뛰기, 오른쪽 미리보기·임시저장·가이드 확정(AI는 생성하기). */
export function GuideActionBar(props: GuideActionState) {
  const { t } = useTranslation("features/write-posting-guide");
  const isBusy = props.pending !== null;

  return (
    <div className="hidden shrink-0 items-center justify-between bg-background p-5 tablet:flex">
      <SkipButton {...props} />
      {props.method === "AI" ? (
        <GenerateAiButton {...props} />
      ) : (
        <div className="flex items-center gap-3">
          <Button
            variant="outline-foreground"
            disabled={props.isPreviewDisabled}
            onClick={props.onPreview}
          >
            {t("action.preview")}
          </Button>
          <Button
            variant="outline"
            isLoading={props.pending === "saveDraft"}
            disabled={props.isLocked || isBusy}
            onClick={props.onSaveDraft}
          >
            {t("action.saveDraft")}
          </Button>
          <Button
            isLoading={props.pending === "confirm"}
            disabled={props.isLocked || isBusy || !props.isComplete}
            onClick={props.onConfirm}
          >
            {t("action.confirm")}
          </Button>
        </div>
      )}
    </div>
  );
}

/** MO 하단 바(시안 14165:275705): 임시저장·가이드 확정이 반씩(AI는 생성하기 한 줄). */
export function GuideMobileActionBar(props: GuideActionState) {
  const { t } = useTranslation("features/write-posting-guide");
  const isBusy = props.pending !== null;

  return (
    <div className="flex shrink-0 gap-4 bg-background p-4 tablet:hidden">
      {props.method === "AI" ? (
        <GenerateAiButton {...props} className="flex-1" />
      ) : (
        <>
          <Button
            variant="outline"
            className="flex-1"
            isLoading={props.pending === "saveDraft"}
            disabled={props.isLocked || isBusy}
            onClick={props.onSaveDraft}
          >
            {t("action.saveDraft")}
          </Button>
          <Button
            className="flex-1"
            isLoading={props.pending === "confirm"}
            disabled={props.isLocked || isBusy || !props.isComplete}
            onClick={props.onConfirm}
          >
            {t("action.confirm")}
          </Button>
        </>
      )}
    </div>
  );
}

/** MO 서브 헤더 오른쪽(시안 14165:275663): 건너뛰기·미리보기(AI는 건너뛰기만). */
export function GuideMobileHeaderActions(props: GuideActionState) {
  const { t } = useTranslation("features/write-posting-guide");

  return (
    <div className="flex items-center gap-2">
      <SkipButton {...props} size="sm" />
      {props.method === "MANUAL" && (
        <Button
          variant="outline-foreground"
          size="sm"
          disabled={props.isPreviewDisabled}
          onClick={props.onPreview}
        >
          {t("action.preview")}
        </Button>
      )}
    </div>
  );
}

function SkipButton({
  isLocked,
  pending,
  onSkip,
  size,
}: GuideActionState & { size?: "sm" }) {
  const { t } = useTranslation("features/write-posting-guide");
  return (
    <Button
      variant="outline"
      size={size}
      isLoading={pending === "skip"}
      disabled={isLocked || pending !== null}
      onClick={onSkip}
    >
      {t("action.skip")}
    </Button>
  );
}

function GenerateAiButton({
  isLocked,
  pending,
  onGenerateAi,
  className,
}: GuideActionState & { className?: string }) {
  const { t } = useTranslation("features/write-posting-guide");
  return (
    <Button
      className={className}
      disabled={isLocked || pending !== null}
      onClick={onGenerateAi}
    >
      <WandSparkles aria-hidden />
      {t("action.generateAi")}
    </Button>
  );
}
