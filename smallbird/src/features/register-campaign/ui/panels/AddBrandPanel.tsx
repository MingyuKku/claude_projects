import { tryit } from "radash";
import { useId, useState } from "react";
import { toast } from "sonner";

import { addBrand, useBrands } from "@/entities/brand";
import { FormField } from "@/shared/components/form-field";
import { ThumbnailUpload } from "@/shared/components/thumbnail-upload";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { uploadCampaignFile } from "../../api/upload-campaign-file";
import { checkImageFile, IMAGE_ACCEPT } from "../../model/file-rules";
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

// 브랜드 관리 > 브랜드 추가(시안 13320:115525·115811·115824). 브랜드명 한 칸(국문·영문 구분 없음)과 선택 이미지.
// 이미지는 고르는 즉시 올리고(A-7) 받은 번호로 저장함. 저장하면 목록을 다시 읽고 새 브랜드를 1단계에 고른 채 닫음.
// 실패하면 토스트를 띄우고 입력값을 그대로 둠(REQ-10-0020). "<"는 브랜드 관리 목록으로 돌아감.
export function AddBrandPanel() {
  const { t } = useTranslation("features/register-campaign");
  const imageLabelId = useId();
  const { mutate } = useBrands();
  const { openPanel, closePanel } = useRegisterPanel();
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );
  const [name, setName] = useState("");
  const [image, setImage] = useState<UploadedCampaignFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = name.trim().length > 0 && !isUploading && !isSaving;

  async function handlePickFile(file: File) {
    const ruleError = checkImageFile(file);
    if (ruleError) {
      toast.error(t(FILE_ERROR_KEYS[ruleError]));
      return;
    }
    setIsUploading(true);
    const [error, uploaded] = await tryit(uploadCampaignFile)(file);
    setIsUploading(false);
    if (error) {
      toast.error(t("toast.saveFailed"));
      return;
    }
    setImage(uploaded);
  }

  async function handleSave() {
    setIsSaving(true);
    const [error, created] = await tryit(addBrand)({
      name: name.trim(),
      imageAttachmentIdx: image?.attachmentIdx ?? null,
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
      <section className="flex flex-col gap-4 ds-p-5 pb-0">
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
          <p id={imageLabelId} className="ds-text-sm-5-medium">
            {t("brands.image.label")}
          </p>
          <ThumbnailUpload
            aria-labelledby={imageLabelId}
            imageUrl={image?.url}
            title={t("brands.image.title")}
            description={t("brands.image.description")}
            accept={IMAGE_ACCEPT}
            removeLabel={t("brands.image.remove")}
            disabled={isUploading}
            onPickFile={(file) => void handlePickFile(file)}
            onRemove={() => setImage(null)}
          />
        </div>
      </section>
    </PanelLayout>
  );
}
