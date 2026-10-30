import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { checkUploadFile, IMAGE_EXTENSIONS } from "@/entities/account";
import { AvatarEdit } from "@/shared/components/avatar-edit";
import { useTranslation } from "@/shared/i18n";

import type { ChangeEvent } from "react";

const IMAGE_ACCEPT = IMAGE_EXTENSIONS.map((extension) => `.${extension}`).join(
  ",",
);

export interface PickedImage {
  file: File;
  previewUrl: string;
}

interface ProfileImageFieldProps {
  image: PickedImage | null;
  onChange: (image: PickedImage) => void;
}

// Sub ID 생성·수정 폼의 "프로필 이미지(선택)" 행. 고른 이미지를 바꾸거나 화면을 떠날 때 미리보기 주소를 풀어 줌.
export function ProfileImageField({ image, onChange }: ProfileImageFieldProps) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image.previewUrl);
    };
  }, [image]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // 같은 파일을 다시 골라도 change가 일어나도록 비움.
    event.target.value = "";
    if (!file) return;
    const rejection = checkUploadFile(file, IMAGE_EXTENSIONS);
    if (rejection) {
      toast.error(t(`create.profileImage.error.${rejection}`));
      return;
    }
    onChange({ file, previewUrl: URL.createObjectURL(file) });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm leading-5 font-medium text-foreground">
        {t("create.profileImage.label")}
      </p>
      <div className="flex justify-center">
        <AvatarEdit
          src={image?.previewUrl}
          alt={t("create.profileImage.alt")}
          editLabel={t("create.profileImage.edit")}
          onClickEdit={() => inputRef.current?.click()}
        />
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          tabIndex={-1}
          aria-hidden="true"
          className="hidden"
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
