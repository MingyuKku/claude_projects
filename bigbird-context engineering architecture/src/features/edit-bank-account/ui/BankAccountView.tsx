import { Download } from "lucide-react";

import { InfoRow } from "@/shared/components/info-row";
import { useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

import { useDownloadBankBook } from "../api/use-download-bank-book";

import type { BankAccountViewModel } from "../model/schema";

const EMPTY_VALUE = "-";

interface BankAccountViewProps {
  /** 등록된 계좌. 아직 없으면 null(값은 `-`, 버튼은 "등록"). */
  account: BankAccountViewModel | null;
  onClickEdit: () => void;
}

// Figma 계좌정보 보기(10724:185992)·미등록(10724:185968): 읽기 전용 표와 아래 "수정"(미등록은 "등록").
export function BankAccountView({
  account,
  onClickEdit,
}: BankAccountViewProps) {
  const { t } = useTranslation("features/edit-bank-account");
  const { t: tCommon } = useTranslation();

  return (
    <Card>
      <div className="flex flex-col px-4 pt-4 pb-3 tablet:px-5 tablet:pt-5">
        <InfoRow label={t("form.bank")}>
          {account?.bankName || EMPTY_VALUE}
        </InfoRow>
        <InfoRow label={t("form.accountNumber")}>
          {account?.accountNumber || EMPTY_VALUE}
        </InfoRow>
        <InfoRow label={t("form.accountHolder")}>
          {account?.accountHolder || EMPTY_VALUE}
        </InfoRow>
        <InfoRow label={t("form.bankBook")} isMuted={false}>
          <BankBookValue account={account} />
        </InfoRow>
      </div>
      <div className="flex justify-end p-4 tablet:p-5">
        <Button
          type="button"
          variant={account ? "outline" : "default"}
          onClick={onClickEdit}
        >
          {account ? tCommon("action.edit") : t("view.register")}
        </Button>
      </div>
    </Card>
  );
}

// 통장 사본은 눌러서 내려받음(`GET /account/bank/download`). 파일 이름이 길면 말줄임하지 않고 버튼이 늘어남(시안).
function BankBookValue({ account }: { account: BankAccountViewModel | null }) {
  const { t } = useTranslation("features/edit-bank-account");
  const { download, isDownloading } = useDownloadBankBook(
    account?.bankBookFileName ?? null,
  );
  if (!account?.hasBankBookFile) {
    return (
      <Badge variant="gray" size="sm">
        {t("file.none")}
      </Badge>
    );
  }
  const label = account.bankBookFileName ?? t("file.registered");

  return (
    <Button
      type="button"
      variant="outline-foreground"
      size="sm"
      disabled={isDownloading}
      aria-label={t("file.download", { name: label })}
      onClick={() => void download()}
    >
      {label}
      <Download />
    </Button>
  );
}
