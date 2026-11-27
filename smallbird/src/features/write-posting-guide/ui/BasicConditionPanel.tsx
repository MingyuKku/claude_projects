import { POSTING_GUIDE_LIMITS } from "@/entities/campaign-progress";
import { FormField } from "@/shared/components/form-field";
import { KeywordInput } from "@/shared/components/keyword-input";
import { TextField } from "@/shared/components/text-field";
import { useTranslation } from "@/shared/i18n";

import { MediaCountField } from "./MediaCountField";
import { ReferenceUrlField } from "./ReferenceUrlField";

import type { PostingGuideBasicCondition } from "@/entities/campaign-progress";

interface BasicConditionPanelProps {
  condition: PostingGuideBasicCondition;
  onChange: (value: Partial<PostingGuideBasicCondition>) => void;
  /** 패널 안 "기본 조건 설정" 제목. 탭이 없는 AI 방식만 둠(직접 작성은 바로 위 탭 이름과 같음). */
  hasTitle: boolean;
  disabled?: boolean;
}

// 기본 조건 설정(시안 Requirements Panel): 사진·영상 최소 개수, 필수 키워드·해시태그(각 10개), 유의 사항(300자), 참고 URL.
export function BasicConditionPanel({
  condition,
  onChange,
  hasTitle,
  disabled,
}: BasicConditionPanelProps) {
  const { t } = useTranslation("features/write-posting-guide");
  const removeLabel = (keyword: string) =>
    t("basic.removeKeyword", { keyword });

  return (
    <section
      aria-label={t("basic.title")}
      className="flex flex-col gap-4 rounded-md border border-border bg-background p-3.75"
    >
      {hasTitle && (
        <h3 className="ds-text-sm-none-semibold">{t("basic.title")}</h3>
      )}
      <div className="flex gap-5 tablet:gap-10 desktop:gap-12">
        <MediaCountField
          label={t("basic.photoCount")}
          unit={t("basic.photoUnit")}
          value={condition.minPhotoCount}
          maxDigits={POSTING_GUIDE_LIMITS.mediaCountDigits}
          onChangeValue={(minPhotoCount) => onChange({ minPhotoCount })}
          disabled={disabled}
        />
        <MediaCountField
          label={t("basic.videoCount")}
          unit={t("basic.videoUnit")}
          value={condition.minVideoCount}
          maxDigits={POSTING_GUIDE_LIMITS.mediaCountDigits}
          onChangeValue={(minVideoCount) => onChange({ minVideoCount })}
          disabled={disabled}
        />
      </div>
      <KeywordInput
        label={t("basic.keywords")}
        placeholder={t("basic.keywordsPlaceholder")}
        value={condition.requiredKeywords}
        maxCount={POSTING_GUIDE_LIMITS.keywordCount}
        removeLabel={removeLabel}
        onChangeValue={(requiredKeywords) => onChange({ requiredKeywords })}
        disabled={disabled}
      />
      <KeywordInput
        label={t("basic.hashtags")}
        placeholder={t("basic.hashtagsPlaceholder")}
        value={condition.requiredHashtags}
        maxCount={POSTING_GUIDE_LIMITS.hashtagCount}
        removeLabel={removeLabel}
        onChangeValue={(requiredHashtags) => onChange({ requiredHashtags })}
        disabled={disabled}
      />
      <FormField label={t("basic.notice")} disabled={disabled}>
        {(control) => (
          <TextField
            {...control}
            variant="count"
            isWide
            maxLength={POSTING_GUIDE_LIMITS.noticeLength}
            placeholder={t("basic.noticePlaceholder")}
            value={condition.notice}
            onChange={(event) => onChange({ notice: event.target.value })}
          />
        )}
      </FormField>
      <ReferenceUrlField
        value={condition.referenceUrls}
        onChangeValue={(referenceUrls) => onChange({ referenceUrls })}
        disabled={disabled}
      />
    </section>
  );
}
