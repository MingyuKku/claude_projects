import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { checkUploadFile, IMAGE_EXTENSIONS } from "@/entities/account";
import { useTranslation } from "@/shared/i18n";

import { useProfileImage } from "../api/use-profile-image";

import type { ProfileImageSource } from "../api/use-profile-image";
import type { ChangeEvent } from "react";

interface PickedImage {
  file: File;
  previewUrl: string;
}

/** 프로필 이미지 고르기·미리보기·저장 뒤 표시. 미리보기 주소는 바뀌거나 화면을 떠날 때 풀어 줌. */
export function useProfileImagePicker(source: ProfileImageSource) {
  const { t } = useTranslation("features/edit-account-profile");
  const { profileUrl, refresh } = useProfileImage(source);
  const [picked, setPicked] = useState<PickedImage | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (picked) URL.revokeObjectURL(picked.previewUrl);
    };
  }, [picked]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // 같은 파일을 다시 골라도 change가 일어나도록 비움.
    event.target.value = "";
    if (!file) return;
    const rejection = checkUploadFile(file, IMAGE_EXTENSIONS);
    if (rejection) {
      toast.error(t(`form.profileImage.error.${rejection}`));
      return;
    }
    setPicked({ file, previewUrl: URL.createObjectURL(file) });
  }

  return {
    inputRef,
    previewSrc: picked?.previewUrl ?? profileUrl ?? undefined,
    pickedFile: picked?.file ?? null,
    // 등록(POST)·수정(PATCH)을 가르는 기준이라 본인 이미지로 판단함. 없는 상태의 PATCH는 404.
    hasExistingImage: profileUrl !== null,
    handleChange,
    openPicker: () => inputRef.current?.click(),
    /** 고른 이미지를 버림(취소, 저장 반영 뒤). */
    discardPicked: () => setPicked(null),
    refresh,
  };
}
