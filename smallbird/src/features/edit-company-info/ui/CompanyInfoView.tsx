import { Download } from "lucide-react";

import { InfoRow } from "@/shared/components/info-row";
import { useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

import {
  useDownloadCompanyDocument,
  type CompanyDocumentKind,
} from "../api/use-download-company-document";

import type { CompanyInfoViewModel } from "@/entities/account";

// 미등록(회사정보가 없음)일 때 값 자리에 보이는 표시. 계좌정보 미등록 보기와 같음.
const EMPTY_VALUE = "-";

interface CompanyInfoViewProps {
  /** 등록된 회사정보. 아직 없으면 null(값은 `-`, 서류는 "등록된 파일이 없습니다", 버튼은 "등록"). */
  company: CompanyInfoViewModel | null;
  onClickEdit: () => void;
}

// Figma 회사정보 보기(10724:185906): 라벨(필수는 파란 *)·값 읽기 전용 표와 아래 "수정". 서류는 파일명 다운로드 버튼(MO는 라벨 아래 전체 폭).
// 미등록은 회원가입에서 필수라 시안에 없어, 디자인 QA(26/11/05 - PC - 33)대로 계좌정보 미등록 보기(10724:185968)처럼 빈 값 + "등록"으로 그림.
export function CompanyInfoView({
  company,
  onClickEdit,
}: CompanyInfoViewProps) {
  const { t } = useTranslation("features/edit-company-info");
  const { t: tCommon } = useTranslation();
  // 등록된 회사정보의 비어 있는 선택 항목(회사 분류·URL)은 원래대로 빈칸이고, 미등록일 때만 `-`.
  const text = (value: string | null | undefined) =>
    company === null ? EMPTY_VALUE : (value ?? "");

  return (
    <Card>
      <div className="flex flex-col px-4 pt-4 pb-3 tablet:px-5 tablet:pt-5">
        <InfoRow label={t("form.companyName")} isRequired>
          {text(company?.companyName)}
        </InfoRow>
        <InfoRow label={t("form.contact")} isRequired>
          {text(company?.contact)}
        </InfoRow>
        <InfoRow label={t("form.businessNumber")} isRequired>
          {text(company?.businessNumber)}
        </InfoRow>
        <InfoRow
          label={t("form.businessFile")}
          isRequired
          isMuted={false}
          isStackedOnMobile
        >
          <DocumentButton
            kind="businessRegistration"
            hasFile={company?.hasBusinessRegistrationFile ?? false}
            name={company?.businessRegistrationFileName ?? null}
          />
        </InfoRow>
        <InfoRow label={t("form.mailorderNumber")} isRequired>
          {text(company?.mailorderNumber)}
        </InfoRow>
        <InfoRow
          label={t("form.mailorderFile")}
          isRequired
          isMuted={false}
          isStackedOnMobile
        >
          <DocumentButton
            kind="mailorderReport"
            hasFile={company?.hasMailorderFile ?? false}
            name={company?.mailorderFileName ?? null}
          />
        </InfoRow>
        <InfoRow label={t("form.category")}>
          {text(company?.categoryName)}
        </InfoRow>
        <InfoRow label={t("form.url")}>{text(company?.companyUrl)}</InfoRow>
      </div>
      <div className="flex justify-end p-4 tablet:p-5">
        <Button
          type="button"
          variant={company ? "outline" : "default"}
          onClick={onClickEdit}
        >
          {company ? tCommon("action.edit") : t("view.register")}
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
  if (!hasFile) {
    return (
      <Badge variant="gray" size="sm">
        {t("file.none")}
      </Badge>
    );
  }
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
