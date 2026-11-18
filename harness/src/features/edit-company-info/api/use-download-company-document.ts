import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";

import { useTranslation } from "@/shared/i18n";
import { saveFile } from "@/shared/lib";

import {
  downloadBusinessRegistration,
  downloadMailorderReport,
} from "./company-api";

const DOWNLOADERS = {
  businessRegistration: downloadBusinessRegistration,
  mailorderReport: downloadMailorderReport,
};
const FALLBACK_FILE_NAMES = {
  businessRegistration: "business-registration",
  mailorderReport: "mailorder-report",
};

export type CompanyDocumentKind = keyof typeof DOWNLOADERS;

/**
 * 회사정보 서류 내려받기. 파일 이름은 서버가 준 이름 → 회사정보 조회가 준 원본 이름 순으로 쓰고, 둘 다 없으면 기본 이름.
 * 요청 중에는 `isDownloading`이 true라 버튼을 막아 연타를 방지함. 실패는 오류 토스트.
 */
export function useDownloadCompanyDocument(
  kind: CompanyDocumentKind,
  storedFileName: string | null,
) {
  const { t } = useTranslation("features/edit-company-info");
  const [isDownloading, setIsDownloading] = useState(false);

  async function download() {
    setIsDownloading(true);
    const [error, file] = await tryit(DOWNLOADERS[kind])();
    setIsDownloading(false);
    if (error) {
      toast.error(t("file.error.download"));
      return;
    }
    saveFile(
      file.blob,
      file.fileName ?? storedFileName ?? FALLBACK_FILE_NAMES[kind],
    );
  }

  return { download, isDownloading };
}
