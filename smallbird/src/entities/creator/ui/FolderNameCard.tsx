import { useState } from "react";

import { InputCard } from "@/shared/components/cards";
import { useTranslation } from "@/shared/i18n";

import { FOLDER_NAME_MAX_LENGTH } from "../model/constants";

interface FolderNameCardProps {
  isSubmitting?: boolean;
  onChangeName?: (name: string) => void;
  /** 앞뒤 공백을 뺀 이름. 빈 이름으로는 부르지 않음. */
  onSubmitName: (name: string) => void;
}

// 새 폴더 이름 입력. 서버에 만드는 일은 부르는 쪽이 함.
export function FolderNameCard({
  isSubmitting = false,
  onChangeName,
  onSubmitName,
}: FolderNameCardProps) {
  const { t } = useTranslation("entities/creator");
  const [name, setName] = useState("");

  const trimmedName = name.trim();
  const canSubmit = trimmedName !== "" && !isSubmitting;

  function handleSubmit() {
    if (canSubmit) onSubmitName(trimmedName);
  }

  return (
    <InputCard
      className="shrink-0"
      title={t("newFolder.title")}
      inputProps={{
        autoFocus: true,
        value: name,
        maxLength: FOLDER_NAME_MAX_LENGTH,
        placeholder: t("newFolder.placeholder"),
        "aria-label": t("newFolder.title"),
        onChange: (event) => {
          setName(event.target.value);
          onChangeName?.(event.target.value);
        },
        onKeyDown: (event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing)
            handleSubmit();
        },
      }}
      actionLabel={t("newFolder.submit")}
      isActionDisabled={!canSubmit}
      onClickAction={handleSubmit}
    />
  );
}
