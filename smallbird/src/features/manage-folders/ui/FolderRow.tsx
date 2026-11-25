import { Folder, Pencil } from "lucide-react";
import { useState } from "react";

import { FOLDER_NAME_MAX_LENGTH, focusOnMount } from "@/entities/creator";
import { ButtonList } from "@/shared/components/button-list";
import { TrashIcon } from "@/shared/components/icons";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import type { FolderDraft } from "../model/folder-draft";
import type { ComponentProps } from "react";

interface FolderRowProps {
  folder: Pick<FolderDraft, "name" | "count">;
  isEditing: boolean;
  /** 수정·삭제를 끔. 다른 폴더의 이름을 고치는 중(적던 이름이 버려지지 않게)이거나 고칠 수 없는 `전체`. */
  isLocked?: boolean;
  handleProps?: ComponentProps<typeof Button>;
  onClickEdit: () => void;
  onSubmitName: (name: string) => void;
  onClickRemove: () => void;
}

export function FolderRow({
  folder,
  isEditing,
  isLocked = false,
  handleProps,
  onClickEdit,
  onSubmitName,
  onClickRemove,
}: FolderRowProps) {
  const { t } = useTranslation("features/manage-folders");

  return (
    <ButtonList
      className="h-16"
      title={folder.name}
      count={formatNumber(folder.count)}
      icon={<Folder />}
      handleLabel={t("row.handle", { name: folder.name })}
      handleProps={handleProps}
      editor={
        isEditing && (
          <NameEditor initialName={folder.name} onSubmitName={onSubmitName} />
        )
      }
      actions={
        <>
          <Button
            variant="outline-foreground"
            size="icon"
            disabled={isLocked}
            aria-label={t("row.edit", { name: folder.name })}
            onClick={onClickEdit}
          >
            <Pencil />
          </Button>
          <Button
            variant="outline-foreground"
            size="icon"
            disabled={isLocked}
            aria-label={t("row.remove", { name: folder.name })}
            onClick={onClickRemove}
          >
            <TrashIcon />
          </Button>
        </>
      }
    />
  );
}

interface NameEditorProps {
  initialName: string;
  onSubmitName: (name: string) => void;
}

function NameEditor({ initialName, onSubmitName }: NameEditorProps) {
  const { t } = useTranslation("features/manage-folders");
  const [name, setName] = useState(initialName);

  const trimmedName = name.trim();

  function handleSubmit() {
    if (trimmedName) onSubmitName(trimmedName);
  }

  return (
    <span className="flex items-center gap-2">
      <Input
        ref={focusOnMount}
        className="min-w-0 flex-1"
        value={name}
        maxLength={FOLDER_NAME_MAX_LENGTH}
        aria-label={t("row.name")}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing)
            handleSubmit();
        }}
      />
      <Button
        variant="outline"
        className="h-9.5 desktop:h-10"
        disabled={!trimmedName}
        onClick={handleSubmit}
      >
        {t("row.submit")}
      </Button>
    </span>
  );
}
