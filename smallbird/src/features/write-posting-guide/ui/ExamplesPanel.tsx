import { POSTING_GUIDE_LIMITS } from "@/entities/campaign-progress";
import { EmptyState } from "@/shared/components/empty-state";
import { FormField } from "@/shared/components/form-field";
import { TextField } from "@/shared/components/text-field";
import { useTranslation } from "@/shared/i18n";

interface ExamplesPanelProps {
  contentGuide: string;
  onChangeContentGuide: (value: string) => void;
  disabled?: boolean;
}

// 예시 이미지/영상 첨부 탭(시안 14165:273166): 콘텐츠 개요(필수, 300자) + 이미지·영상 예시 카드.
// 예시 카드는 파일 주소·업로드 API 답(백엔드 요청 B-20·B-21)을 받은 뒤 붙임.
export function ExamplesPanel({
  contentGuide,
  onChangeContentGuide,
  disabled,
}: ExamplesPanelProps) {
  const { t } = useTranslation("features/write-posting-guide");
  const { t: tCommon } = useTranslation();

  return (
    <section
      aria-label={t("tab.examples")}
      className="flex flex-col gap-4 rounded-md border border-border bg-background p-3.75"
    >
      <FormField
        label={t("examples.contentGuide")}
        isRequired
        disabled={disabled}
      >
        {(control) => (
          <TextField
            {...control}
            variant="count"
            isWide
            textareaClassName="h-22"
            maxLength={POSTING_GUIDE_LIMITS.contentGuideLength}
            placeholder={t("examples.contentGuidePlaceholder")}
            value={contentGuide}
            onChange={(event) => onChangeContentGuide(event.target.value)}
          />
        )}
      </FormField>
      <EmptyState type="construction" title={tCommon("status.comingSoon")} />
    </section>
  );
}
