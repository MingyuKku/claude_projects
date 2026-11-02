import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { checkUploadFile, IMAGE_EXTENSIONS } from "@/entities/account";
import { useTranslation } from "@/shared/i18n";

import { useProfileImage } from "../api/use-profile-image";

import type { AccountRole } from "./save-account-profile";
import type { ChangeEvent } from "react";

interface PickedImage {
  file: File;
  previewUrl: string;
}

/**
 * 프로필 이미지 고르기·미리보기·저장 뒤 표시. 미리보기 주소는 바뀌거나 화면을 떠날 때 풀어 줌.
 * Sub ID는 `GET /profile`이 권한 오류로 거부되는 경우를 대비해 저장한 이미지를 이 화면에서만 계속 보임.
 */
export function useProfileImagePicker(accountType: AccountRole) {
  const { t } = useTranslation("features/edit-account-profile");
  const { profileUrl, mutate } = useProfileImage();
  const [picked, setPicked] = useState<PickedImage | null>(null);
  const [saved, setSaved] = useState<PickedImage | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (picked) URL.revokeObjectURL(picked.previewUrl);
    };
  }, [picked]);
  useEffect(() => {
    return () => {
      if (saved) URL.revokeObjectURL(saved.previewUrl);
    };
  }, [saved]);

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

  /** 이미지 저장이 서버에 반영된 뒤 호출. 고른 이미지의 미리보기 주소는 풀리므로 저장본은 새 주소로 따로 만듦. */
  function markSaved() {
    if (accountType === "sub" && picked) {
      setSaved({
        file: picked.file,
        previewUrl: URL.createObjectURL(picked.file),
      });
    }
    setPicked(null);
  }

  return {
    inputRef,
    previewSrc: picked?.previewUrl ?? profileUrl ?? saved?.previewUrl,
    pickedFile: picked?.file ?? null,
    hasExistingImage: Boolean(profileUrl ?? saved),
    handleChange,
    openPicker: () => inputRef.current?.click(),
    discardPicked: () => setPicked(null),
    markSaved,
    refresh: mutate,
  };
}
