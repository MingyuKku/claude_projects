import { tryit } from "radash";
import { useState } from "react";

import { useSwitchAccount, useSwitchAccounts } from "@/entities/session";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

interface SwitchAccountListProps {
  onSuccessSwitch: () => void;
}

export function SwitchAccountList({ onSuccessSwitch }: SwitchAccountListProps) {
  const { t } = useTranslation("features/switch-account");
  const { t: tCommon } = useTranslation();
  const { accounts, isLoading, isError, mutate } = useSwitchAccounts();
  const { trigger, isMutating } = useSwitchAccount();
  const [errorMessage, setErrorMessage] = useState("");

  async function handleClickSwitch(userIdx: number) {
    setErrorMessage("");
    const [error] = await tryit(trigger)({ userIdx });
    if (error) {
      console.error("계정 전환 실패", error);
      setErrorMessage(t("switchFailed"));
      return;
    }
    onSuccessSwitch();
  }

  if (isLoading) return <p role="status">{t("loading")}</p>;
  if (isError)
    return (
      <div role="alert">
        <p>{t("loadFailed")}</p>
        <Button variant="outline" onClick={() => void mutate()}>
          {tCommon("action.retry")}
        </Button>
      </div>
    );

  return (
    <div className="overflow-x-auto text-sm">
      {errorMessage && <p role="alert">{errorMessage}</p>}
      {accounts?.length === 0 && <p>{t("empty")}</p>}
      <ul aria-label={t("listLabel")} aria-busy={isMutating}>
        {accounts?.map((account) => (
          <li
            key={account.userIdx}
            className="mb-4 flex w-140 items-center border border-border py-2.5"
          >
            {/* 기존 UserChange.vue의 아이디·사용자 번호·회사명 순서와 열 너비를 유지한다. */}
            <span className="w-37.5 text-center">{account.identifier}</span>
            <span className="w-25 text-center">{account.userIdx}</span>
            <span className="w-50 text-center">{account.companyName}</span>
            <Button
              variant="outline-foreground"
              size="sm"
              aria-label={t("switchLabel", { identifier: account.identifier })}
              disabled={isMutating}
              onClick={() => void handleClickSwitch(account.userIdx)}
              className="ml-2.5 cursor-pointer"
            >
              {t("switch")}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
