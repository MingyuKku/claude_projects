import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

import { addBrand, BRANDS_KEY } from "@/entities/brand";
import { isApiError } from "@/shared/api";
import { FormField } from "@/shared/components/form-field";
import { ThumbnailUpload } from "@/shared/components/thumbnail-upload";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { uploadCampaignFile } from "../../api/register-api";
import { IMAGE_ACCEPT, validateImageFile } from "../../lib/image-file";
import { useCampaignRegisterStore } from "../../model/store-context";
import { PanelBody, PanelFooter } from "./PanelLayout";

import type { CampaignFile } from "@/entities/campaign";

interface AddBrandPanelProps {
  onClose: () => void;
}

const IMAGE_LABEL_ID = "add-brand-image-label";

// 브랜드 추가(Figma 7555:333746·7555:333881): 브랜드명(국문)*·(영문)*과 브랜드 이미지(선택, 올리지 않으면 기본 프로필).
// "저장"은 국문·영문이 모두 입력됐을 때만 활성이고, 저장하면 브랜드 목록을 다시 읽고 새 브랜드를 선택한 채 닫음.
// 이미지는 고르는 즉시 올리고 받은 파일 id로 저장함.
export function AddBrandPanel({ onClose }: AddBrandPanelProps) {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();
  const { mutate } = useSWRConfig();
  const patchCampaignInfo = useCampaignRegisterStore(
    (state) => state.patchCampaignInfo,
  );
  const [nameKo, setNameKo] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [image, setImage] = useState<CampaignFile | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const canSave = nameKo.trim() !== "" && nameEn.trim() !== "" && !isBusy;

  function showFileError(reason: "format" | "size") {
    toast.error(
      reason === "format" ? t("fileError.format") : t("fileError.size"),
    );
  }

  async function handlePickFile(file: File) {
    const error = validateImageFile(file);
    if (error) {
      showFileError(error);
      return;
    }
    setIsBusy(true);
    try {
      setImage(await uploadCampaignFile(file, "BRAND_IMAGE"));
    } catch (uploadError) {
      const reason = isApiError(uploadError)
        ? (uploadError.data as { reason?: string } | undefined)?.reason
        : undefined;
      if (reason === "INVALID_FILE_TYPE") showFileError("format");
      else if (reason === "FILE_TOO_LARGE") showFileError("size");
      else toast.error(tCommon("error.unexpected"));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSave() {
    if (!canSave) return;
    setIsBusy(true);
    try {
      const brand = await addBrand({
        nameKo: nameKo.trim(),
        nameEn: nameEn.trim(),
        imageFileId: image?.fileId ?? null,
      });
      await mutate(BRANDS_KEY);
      patchCampaignInfo({ brandIdx: brand.brandIdx });
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(tCommon("error.unexpected"));
      setIsBusy(false);
    }
  }

  return (
    <>
      <PanelBody>
        <FormField label={t("addBrand.nameKo.label")} isRequired>
          {(control) => (
            <Input
              {...control}
              value={nameKo}
              placeholder={t("addBrand.name.placeholder")}
              autoComplete="off"
              onChange={(event) => setNameKo(event.target.value)}
            />
          )}
        </FormField>
        <FormField label={t("addBrand.nameEn.label")} isRequired>
          {(control) => (
            <Input
              {...control}
              value={nameEn}
              placeholder={t("addBrand.name.placeholder")}
              autoComplete="off"
              onChange={(event) => setNameEn(event.target.value)}
            />
          )}
        </FormField>
        <div className="flex flex-col gap-2">
          <p
            id={IMAGE_LABEL_ID}
            className="text-sm leading-5 font-medium text-foreground"
          >
            {t("addBrand.image.label")}
          </p>
          <ThumbnailUpload
            aria-labelledby={IMAGE_LABEL_ID}
            imageUrl={image?.url}
            title={t("addBrand.image.title")}
            description={t("addBrand.image.description")}
            accept={IMAGE_ACCEPT}
            removeLabel={tCommon("attachment.remove")}
            disabled={isBusy}
            onPickFile={(file) => void handlePickFile(file)}
            onRemove={() => setImage(null)}
          />
        </div>
      </PanelBody>
      <PanelFooter>
        <Button
          type="button"
          className="h-9.5 w-full desktop:h-10"
          disabled={!canSave}
          onClick={() => void handleSave()}
        >
          {tCommon("action.save")}
        </Button>
      </PanelFooter>
    </>
  );
}
