import { EmptyState } from "@/shared/components/empty-state";
import { SkeletonGroup } from "@/shared/components/skeleton-presets";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { useBankAccount, useBankList } from "../api/use-bank-account";
import { BankAccountCard } from "./BankAccountCard";
import { BankAccountFormSkeleton } from "./BankAccountFormSkeleton";

/** 계좌와 은행 목록을 읽은 뒤 폼을 그림. 은행 이름 → 인덱스 변환에 목록이 먼저 필요해서 둘 다 기다림. */
export function BankAccountSection() {
  const { t: tCommon } = useTranslation();
  const account = useBankAccount();
  const bankList = useBankList();

  // 둘 중 무엇이 실패했는지와 관계없이 함께 다시 읽음(은행 목록은 immutable이라 자동으로 다시 읽지 않음).
  function handleClickRetry() {
    void account.mutate();
    void bankList.mutate();
  }

  if (account.isLoading || bankList.isLoading) {
    return (
      <SkeletonGroup>
        <BankAccountFormSkeleton />
      </SkeletonGroup>
    );
  }

  if (account.isError || bankList.isError || !account.hasLoaded) {
    return (
      <EmptyState
        type="alarm"
        title={tCommon("error.unexpected")}
        className="py-20"
        action={
          <Button variant="outline" onClick={handleClickRetry}>
            {tCommon("action.retry")}
          </Button>
        }
      />
    );
  }

  return (
    <BankAccountCard
      account={account.account}
      banks={bankList.banks}
      onSaved={() => void account.mutate()}
    />
  );
}
