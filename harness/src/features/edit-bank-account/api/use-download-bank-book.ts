import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";

import { useTranslation } from "@/shared/i18n";
import { saveFile } from "@/shared/lib";

import { downloadBankBook } from "./bank-api";

const FALLBACK_FILE_NAME = "bankbook";

/**
 * 통장 사본 내려받기. 파일 이름은 서버가 준 이름 → 계좌 조회가 준 원본 이름 순으로 쓰고, 둘 다 없으면 기본 이름.
 * 요청 중에는 `isDownloading`이 true라 버튼을 막아 연타를 방지함. 실패는 오류 토스트.
 */
export function useDownloadBankBook(storedFileName: string | null) {
  const { t } = useTranslation("features/edit-bank-account");
  const [isDownloading, setIsDownloading] = useState(false);

  async function download() {
    setIsDownloading(true);
    const [error, file] = await tryit(downloadBankBook)();
    setIsDownloading(false);
    if (error) {
      toast.error(t("file.error.download"));
      return;
    }
    saveFile(file.blob, file.fileName ?? storedFileName ?? FALLBACK_FILE_NAME);
  }

  return { download, isDownloading };
}
