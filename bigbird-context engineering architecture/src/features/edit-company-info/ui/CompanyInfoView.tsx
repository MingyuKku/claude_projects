import { Download } from "lucide-react";

import { InfoRow } from "@/shared/components/info-row";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

import {
  useDownloadCompanyDocument,
  type CompanyDocumentKind,
} from "../api/use-download-company-document";

import type { CompanyInfoViewModel } from "@/entities/account";

interface CompanyInfoViewProps {
  company: CompanyInfoViewModel;
  onClickEdit: () => void;
}

// Figma 회사정보 보기(10724:185906): 라벨(필수는 파란 *)·값 읽기 전용 표와 아래 "수정". 서류는 파일명 다운로드 버튼(MO는 라벨 아래 전체 폭).
export function CompanyInfoView({
  company,
  onClickEdit,
}: CompanyInfoViewProps) {
  const { t } = useTranslation("features/edit-company-info");
  const { t: tCommon } = useTranslation();

  return (
    <Card>
      <div className="flex flex-col px-4 pt-4 pb-3 tablet:px-5 tablet:pt-5">
        <InfoRow label={t("form.companyName")} isRequired>
          {company.companyName}
        </InfoRow>
        <InfoRow label={t("form.contact")} isRequired>
          {company.contact}
        </InfoRow>
        <InfoRow label={t("form.businessNumber")} isRequired>
          {company.businessNumber}
        </InfoRow>
        <InfoRow
          label={t("form.businessFile")}
          isRequired
          isMuted={false}
          isStackedOnMobile
        >
          <DocumentButton
            kind="businessRegistration"
            hasFile={company.hasBusinessRegistrationFile}
            name={company.businessRegistrationFileName}
          />
        </InfoRow>
        <InfoRow label={t("form.mailorderNumber")} isRequired>
          {company.mailorderNumber}
        </InfoRow>
        <InfoRow
          label={t("form.mailorderFile")}
          isRequired
          isMuted={false}
          isStackedOnMobile
        >
          <DocumentButton
            kind="mailorderReport"
            hasFile={company.hasMailorderFile}
            name={company.mailorderFileName}
          />
        </InfoRow>
        <InfoRow label={t("form.category")}>
          {company.categoryName ?? ""}
        </InfoRow>
        <InfoRow label={t("form.url")}>{company.companyUrl}</InfoRow>
      </div>
      <div className="flex justify-end p-4 tablet:p-5">
        <Button type="button" variant="outline" onClick={onClickEdit}>
          {tCommon("action.edit")}
        </Button>
      </div>
    </Card>
  );
}

interface DocumentButtonProps {
  kind: CompanyDocumentKind;
  hasFile: boolean;
  name: string | null;
}

// 서류는 눌러서 내려받음(`GET /account/company/{registration|mailorder}/download`). 파일 이름이 길면 말줄임하지 않고 버튼이 늘어남(시안).
function DocumentButton({ kind, hasFile, name }: DocumentButtonProps) {
  const { t } = useTranslation("features/edit-company-info");
  const { download, isDownloading } = useDownloadCompanyDocument(kind, name);
  if (!hasFile) return null;
  const label = name ?? t("file.registered");

  return (
    <Button
      type="button"
      variant="outline-foreground"
      size="sm"
      disabled={isDownloading}
      aria-label={t("file.download", { name: label })}
      className="max-tablet:flex-1"
      onClick={() => void download()}
    >
      {label}
      <Download />
    </Button>
  );
}
