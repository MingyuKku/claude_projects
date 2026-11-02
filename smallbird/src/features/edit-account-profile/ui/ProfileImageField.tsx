import { IMAGE_EXTENSIONS } from "@/entities/account";
import { AvatarEdit } from "@/shared/components/avatar-edit";
import { useTranslation } from "@/shared/i18n";

import type { ChangeEvent, RefObject } from "react";

const IMAGE_ACCEPT = IMAGE_EXTENSIONS.map((extension) => `.${extension}`).join(
  ",",
);

interface ProfileImageFieldProps {
  src: string | undefined;
  inputRef: RefObject<HTMLInputElement | null>;
  onClickEdit: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

// Figma 프로필 이미지 행: PC·TAB은 라벨 왼쪽·아바타 오른쪽 표, MO는 라벨 위·아바타 가운데.
export function ProfileImageField({
  src,
  inputRef,
  onClickEdit,
  onChange,
}: ProfileImageFieldProps) {
  const { t } = useTranslation("features/edit-account-profile");

  return (
    <div className="grid grid-cols-1 tablet:min-h-12 tablet:grid-cols-2 tablet:items-start">
      <p className="text-sm leading-5 font-medium text-foreground tablet:min-h-12 tablet:px-4 tablet:font-semibold">
        {t("form.profileImage.label")}
      </p>
      <div className="flex justify-center tablet:justify-start tablet:px-4">
        <AvatarEdit
          src={src}
          alt={t("form.profileImage.alt")}
          editLabel={t("form.profileImage.edit")}
          onClickEdit={onClickEdit}
        />
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          onChange={onChange}
        />
      </div>
    </div>
  );
}
