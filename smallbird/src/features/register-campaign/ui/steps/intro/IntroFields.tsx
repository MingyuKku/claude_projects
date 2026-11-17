import { tryit } from "radash";
import { useId, useState } from "react";
import { toast } from "sonner";

import { FormField } from "@/shared/components/form-field";
import { TextField } from "@/shared/components/text-field";
import { ThumbnailUpload } from "@/shared/components/thumbnail-upload";
import { useTranslation } from "@/shared/i18n";

import { uploadCampaignFile } from "../../../api/upload-campaign-file";
import { checkImageFile, IMAGE_ACCEPT } from "../../../model/file-rules";
import {
  INTRO_TEXT_MAX_LENGTH,
  needsTitleHashtags,
} from "../../../model/step-completion";
import { useRegisterWizardStore } from "../../../model/wizard-context";
import { DetailMediaField } from "./DetailMediaField";
import { HashtagField } from "./HashtagField";

import type { CampaignIntroDraft } from "@/entities/campaign";

const FILE_ERROR_KEYS = {
  type: "toast.fileType",
  size: "toast.fileSize",
} as const;

interface IntroFieldsProps {
  disabled?: boolean;
}

// 직접 작성 시안과 AI 결과 시안의 칸 구성이 달라, 둘 다 AI 결과 시안의 구성·순서로 통일함.
export function IntroFields({ disabled }: IntroFieldsProps) {
  const { t } = useTranslation("features/register-campaign");
  const mainImageLabelId = useId();
  const intro = useRegisterWizardStore((state) => state.draft.intro);
  const platform = useRegisterWizardStore(
    (state) => state.draft.influencer.platform,
  );
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );
  const [isUploadingMainImage, setIsUploadingMainImage] = useState(false);

  const patch = (value: Partial<CampaignIntroDraft>) =>
    patchStepDraft("intro", value);

  async function handlePickMainImage(file: File) {
    const ruleError = checkImageFile(file);
    if (ruleError) {
      toast.error(t(FILE_ERROR_KEYS[ruleError]));
      return;
    }
    setIsUploadingMainImage(true);
    const [error, uploaded] = await tryit(uploadCampaignFile)(file);
    setIsUploadingMainImage(false);
    if (error) {
      toast.error(t("toast.saveFailed"));
      return;
    }
    patch({ mainImage: uploaded });
  }

  return (
    <div className="flex flex-col ds-gap-4">
      <div className="grid ds-gap-4 desktop:grid-cols-2 desktop:gap-5">
        <section
          aria-labelledby={mainImageLabelId}
          className="flex min-w-0 flex-col gap-2"
        >
          <p id={mainImageLabelId} className="flex gap-0.5 ds-text-sm-5-medium">
            {t("intro.mainImage.label")}
            <span aria-hidden className="ds-text-sm-5-semibold text-primary">
              *
            </span>
          </p>
          <ThumbnailUpload
            aria-labelledby={mainImageLabelId}
            className="aspect-1200/630"
            imageUrl={intro.mainImage?.url}
            title={t("intro.mainImage.title")}
            description={t("intro.mainImage.description")}
            accept={IMAGE_ACCEPT}
            removeLabel={t("intro.mainImage.remove")}
            disabled={disabled || isUploadingMainImage}
            onPickFile={(file) => void handlePickMainImage(file)}
            onRemove={() => patch({ mainImage: null })}
          />
        </section>
        <DetailMediaField
          value={intro.detailMedia}
          onChangeValue={(detailMedia) => patch({ detailMedia })}
          disabled={disabled}
        />
      </div>
      <FormField
        label={t("intro.description.label")}
        isRequired
        disabled={disabled}
      >
        {(control) => (
          <TextField
            {...control}
            variant="count"
            isWide
            textareaClassName="h-22"
            maxLength={INTRO_TEXT_MAX_LENGTH}
            placeholder={t("intro.description.placeholder")}
            value={intro.description}
            onChange={(event) => patch({ description: event.target.value })}
          />
        )}
      </FormField>
      <FormField label={t("intro.notice.label")} isRequired disabled={disabled}>
        {(control) => (
          <TextField
            {...control}
            variant="count"
            isWide
            textareaClassName="h-22"
            maxLength={INTRO_TEXT_MAX_LENGTH}
            placeholder={t("intro.notice.placeholder")}
            value={intro.notice}
            onChange={(event) => patch({ notice: event.target.value })}
          />
        )}
      </FormField>
      {needsTitleHashtags(platform) ? (
        <>
          <HashtagField
            label={t("intro.hashtag.title")}
            value={intro.titleHashtags}
            onChangeValue={(titleHashtags) => patch({ titleHashtags })}
            disabled={disabled}
          />
          <HashtagField
            label={t("intro.hashtag.content")}
            value={intro.contentHashtags}
            onChangeValue={(contentHashtags) => patch({ contentHashtags })}
            disabled={disabled}
          />
        </>
      ) : (
        <HashtagField
          label={t("intro.hashtag.single")}
          value={intro.contentHashtags}
          onChangeValue={(contentHashtags) => patch({ contentHashtags })}
          disabled={disabled}
        />
      )}
    </div>
  );
}
