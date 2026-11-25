import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";

import { useTranslation } from "@/shared/i18n";

import { createBookmarkFolder } from "../api/matching-api";
import { useRefreshBookmarkFolders } from "../api/use-matching";
import { FolderNameCard } from "./FolderNameCard";

interface NewFolderCardProps {
  /** 만들고 폴더 목록을 다시 읽은 뒤. */
  onCreated: (folderIdx: number) => void;
}

// 생성을 누르면 서버에 바로 폴더를 만듦.
export function NewFolderCard({ onCreated }: NewFolderCardProps) {
  const { t } = useTranslation();
  const refreshFolders = useRefreshBookmarkFolders();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmitName(name: string) {
    setIsSubmitting(true);
    const [error, created] = await tryit(createBookmarkFolder)(name);
    if (error) {
      setIsSubmitting(false);
      toast.error(t("error.unexpected"));
      return;
    }
    await tryit(refreshFolders)();
    setIsSubmitting(false);
    if (created.folderIdx !== null) onCreated(created.folderIdx);
  }

  return (
    <FolderNameCard
      isSubmitting={isSubmitting}
      onSubmitName={(name) => void handleSubmitName(name)}
    />
  );
}
