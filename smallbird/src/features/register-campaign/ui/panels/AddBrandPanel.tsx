import { tryit } from "radash";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { addBrand, useBrands } from "@/entities/brand";
import { FormField } from "@/shared/components/form-field";
import { ThumbnailUpload } from "@/shared/components/thumbnail-upload";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { uploadCampaignFile } from "../../api/upload-campaign-file";
import { checkImageFile, IMAGE_ACCEPT } from "../../model/file-rules";
import { getUploadErrorKey } from "../../model/upload-error";
import { useRegisterPanel } from "../../model/use-register-panel";
import { useRegisterWizardStore } from "../../model/wizard-context";
import { PanelLayout } from "./PanelLayout";

import type { UploadedCampaignFile } from "../../api/upload-campaign-file";

/** 브랜드명 최대 글자 수(API A-6.2). */
const BRAND_NAME_MAX_LENGTH = 100;

const FILE_ERROR_KEYS = {
  type: "toast.fileType",
  size: "toast.fileSize",
} as const;

// 이미지는 고르기만 하고, 저장할 때 올려 받은 번호로 저장함. 저장하면 목록을 다시 읽고 새 브랜드를 1단계에 고른 채 닫음.
// 실패하면 토스트를 띄우고 입력값을 그대로 둠. "<"는 브랜드 관리 목록으로 돌아감.
export function AddBrandPanel() {
  const { t } = useTranslation("features/register-campaign");
  const imageLabelId = useId();
  const { mutate } = useBrands();
  const { openPanel, closePanel } = useRegisterPanel();
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );
  const [name, setName] = useState("");
  // 고른 파일과 미리보기 주소. 올린 뒤 저장이 실패해도 다시 올리지 않게 올린 결과를 들고 있음.
  const [image, setImage] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [uploaded, setUploaded] = useState<UploadedCampaignFile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // 패널이 닫히면(저장·뒤로·닫기) 남은 미리보기 주소를 놓아 줌.
  const previewUrlRef = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const canSave = name.trim().length > 0 && image !== null && !isSaving;

  function handlePickFile(file: File) {
    const ruleError = checkImageFile(file);
    if (ruleError) {
      toast.error(t(FILE_ERROR_KEYS[ruleError]));
      return;
    }
    clearImage();
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setImage({ file, previewUrl });
  }

  function clearImage() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setImage(null);
    setUploaded(null);
  }

  async function handleSave() {
    if (!image) return;
    setIsSaving(true);
    let attachmentIdx = uploaded?.attachmentIdx ?? null;
    if (!uploaded) {
      const [uploadError, result] = await tryit(uploadCampaignFile)(image.file);
      if (uploadError) {
        setIsSaving(false);
        toast.error(t(getUploadErrorKey(uploadError)));
        return;
      }
      setUploaded(result);
      attachmentIdx = result.attachmentIdx;
    }
    const [error, created] = await tryit(addBrand)({
      name: name.trim(),
      imageAttachmentIdx: attachmentIdx,
    });
    setIsSaving(false);
    if (error) {
      toast.error(t("toast.saveFailed"));
      return;
    }
    await mutate();
    patchStepDraft("info", { brandIdx: created.brandIdx });
    closePanel();
  }

  return (
    <PanelLayout
      title={t("brands.title")}
      onBack={() => openPanel("brands")}
      onClose={closePanel}
      footer={
        <Button
          className="w-full"
          disabled={!canSave}
          onClick={() => void handleSave()}
        >
          {t("brands.save")}
        </Button>
      }
    >
      <section className="flex flex-col ds-gap-4 ds-p-5 pb-0">
        <h3 className="ds-text-base-none-semibold">{t("brands.addTitle")}</h3>
        <FormField label={t("brands.name.label")} isRequired>
          {(control) => (
            <Input
              {...control}
              value={name}
              maxLength={BRAND_NAME_MAX_LENGTH}
              placeholder={t("brands.name.placeholder")}
              onChange={(event) => setName(event.target.value)}
            />
          )}
        </FormField>
        <div className="flex flex-col gap-2">
          <p
            id={imageLabelId}
            // 시안이 이 라벨만 기기 구분 없는 고정 행간이라 ds- 토큰을 쓰지 않음.
            className="text-sm leading-5 font-medium"
          >
            {t("brands.image.label")}
            <span aria-hidden="true" className="font-semibold text-primary">
              {" *"}
            </span>
          </p>
          <ThumbnailUpload
            aria-labelledby={imageLabelId}
            imageUrl={image?.previewUrl}
            title={t("brands.image.title")}
            accept={IMAGE_ACCEPT}
            removeLabel={t("brands.image.remove")}
            disabled={isSaving}
            onPickFile={handlePickFile}
            onRemove={clearImage}
          />
        </div>
      </section>
    </PanelLayout>
  );
}
