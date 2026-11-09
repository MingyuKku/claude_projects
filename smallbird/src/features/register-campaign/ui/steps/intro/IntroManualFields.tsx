import { useState } from "react";
import { toast } from "sonner";

import { isApiError } from "@/shared/api";
import { FormField } from "@/shared/components/form-field";
import { TextField } from "@/shared/components/text-field";
import { ThumbnailUpload } from "@/shared/components/thumbnail-upload";
import { useTranslation } from "@/shared/i18n";

import { uploadCampaignFile } from "../../../api/register-api";
import { IMAGE_ACCEPT, validateImageFile } from "../../../lib/image-file";
import {
  INTRO_MEDIA_MAX_COUNT,
  INTRO_TEXT_MAX_LENGTH,
} from "../../../model/constants";
import { useCampaignRegisterStore } from "../../../model/store-context";
import { HashtagField } from "./HashtagField";
import { MediaListField } from "./MediaListField";

const MEDIA_ACCEPT = `${IMAGE_ACCEPT},video/mp4,video/quicktime`;
const MAIN_IMAGE_LABEL_ID = "intro-main-image-label";

// 5단계 직접 작성 필드(Figma 7555:335757). AI 결과 카드도 같은 필드·순서를 씀(스펙 D-7).
export function IntroManualFields() {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation("common");
  const intro = useCampaignRegisterStore((state) => state.draft.intro);
  const patchIntro = useCampaignRegisterStore((state) => state.patchIntro);
  const [isBusy, setIsBusy] = useState(false);

  function showUploadError(error: unknown) {
    const reason = isApiError(error)
      ? (error.data as { reason?: string } | undefined)?.reason
      : undefined;
    if (reason === "INVALID_FILE_TYPE") toast.error(t("fileError.format"));
    else if (reason === "FILE_TOO_LARGE") toast.error(t("fileError.size"));
    else toast.error(tCommon("error.unexpected"));
  }

  async function handlePickMainImage(file: File) {
    const error = validateImageFile(file);
    if (error) {
      toast.error(t(`fileError.${error}`));
      return;
    }
    setIsBusy(true);
    try {
      patchIntro({
        mainImage: await uploadCampaignFile(file, "INTRO_MAIN_IMAGE"),
      });
    } catch (uploadError) {
      showUploadError(uploadError);
    } finally {
      setIsBusy(false);
    }
  }

  async function handlePickMedia(files: File[]) {
    const room = INTRO_MEDIA_MAX_COUNT - intro.media.length;
    // 남은 자리보다 많이 골랐으면 안내하고(스펙 §6) 자리만큼만 올림.
    if (files.length > room) toast.error(t("fileError.count"));
    setIsBusy(true);
    const uploaded = [];
    try {
      for (const file of files.slice(0, room)) {
        uploaded.push(await uploadCampaignFile(file, "INTRO_MEDIA"));
      }
    } catch (uploadError) {
      showUploadError(uploadError);
    } finally {
      // 중간에 실패해도 먼저 올라간 파일은 목록에 남김.
      if (uploaded.length > 0) {
        patchIntro({ media: [...intro.media, ...uploaded] });
      }
      setIsBusy(false);
    }
  }

  return (
    <>
      <div className="grid gap-4 desktop:grid-cols-2">
        <div className="flex flex-col gap-2">
          <p
            id={MAIN_IMAGE_LABEL_ID}
            className="flex gap-0.5 text-sm leading-none font-medium"
          >
            {t("intro.mainImage.label")}
            <span aria-hidden className="font-semibold text-primary">
              *
            </span>
          </p>
          <ThumbnailUpload
            aria-labelledby={MAIN_IMAGE_LABEL_ID}
            imageUrl={intro.mainImage?.url}
            title={t("intro.mainImage.title")}
            description={t("intro.mainImage.description")}
            accept={IMAGE_ACCEPT}
            removeLabel={tCommon("attachment.remove")}
            disabled={isBusy}
            onPickFile={(file) => void handlePickMainImage(file)}
            onRemove={() => patchIntro({ mainImage: null })}
            className="aspect-1200/630"
          />
        </div>
        <MediaListField
          value={intro.media}
          accept={MEDIA_ACCEPT}
          disabled={isBusy}
          onPickFiles={(files) => void handlePickMedia(files)}
          onChangeValue={(media) => patchIntro({ media })}
        />
      </div>
      <FormField label={t("intro.description.label")} isRequired>
        {(control) => (
          <TextField
            {...control}
            isWide
            variant="count"
            maxLength={INTRO_TEXT_MAX_LENGTH}
            placeholder={t("intro.description.placeholder")}
            value={intro.description ?? ""}
            onChange={(event) =>
              patchIntro({ description: event.target.value })
            }
          />
        )}
      </FormField>
      <FormField label={t("intro.notice.label")} isRequired>
        {(control) => (
          <TextField
            {...control}
            isWide
            variant="count"
            maxLength={INTRO_TEXT_MAX_LENGTH}
            placeholder={t("intro.notice.placeholder")}
            value={intro.notice ?? ""}
            onChange={(event) => patchIntro({ notice: event.target.value })}
          />
        )}
      </FormField>
      <HashtagField
        value={intro.hashtags}
        onChangeValue={(hashtags) => patchIntro({ hashtags })}
      />
    </>
  );
}
