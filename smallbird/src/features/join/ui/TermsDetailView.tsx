import { TermsDocument } from "@/entities/terms";
import { AuthHeader, AuthText } from "@/shared/components/auth";
import { useTranslation } from "@/shared/i18n";

import { JoinStepFooter } from "./JoinStepFooter";

import type { TermsKind } from "@/entities/terms";

interface TermsDetailViewProps {
  title: string;
  kind: TermsKind;
  confirmLabel: string;
  progress: number;
  onClickBack: () => void;
  onClickConfirm: () => void;
}

/** 약관 동의 단계에서 항목을 열면 보이는 약관 전문 화면. */
export function TermsDetailView({
  title,
  kind,
  confirmLabel,
  progress,
  onClickBack,
  onClickConfirm,
}: TermsDetailViewProps) {
  const { t } = useTranslation("features/join");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AuthHeader
        title={t("header")}
        onClickBack={onClickBack}
        progress={progress}
      />

      {/* 모바일은 화면 전체가 스크롤되고, 태블릿 이상은 문서가 스크롤되며 본문 상자 안쪽만 따로 스크롤됨. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto tablet:flex-none tablet:overflow-visible">
        <div className="flex flex-col gap-5 pt-7.5 tablet:gap-6 tablet:pt-6 tablet:pb-12">
          <AuthText size="xl" weight="medium" tone="heading">
            {title}
          </AuthText>

          <div className="flex flex-col gap-4 rounded-[20px] border border-line1 bg-light p-5 tablet:h-140.5 tablet:flex-none tablet:overflow-y-auto">
            <TermsDocument kind={kind} />
          </div>
        </div>
      </div>

      <JoinStepFooter label={confirmLabel} onClick={onClickConfirm} />
    </div>
  );
}
