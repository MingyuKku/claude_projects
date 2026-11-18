import { formatListDate, useTranslation } from "@/shared/i18n";
import { EMPTY_VALUE, orEmptyValue } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";

import { DeleteButton } from "./DeleteButton";
import { EditButton } from "./EditButton";

import type { SubAccountViewModel } from "../model/types";

interface SubAccountCardListProps {
  accounts: SubAccountViewModel[];
  activeAccountIdx: number | null;
  onClickPermission: (account: SubAccountViewModel) => void;
  onClickEdit: (account: SubAccountViewModel) => void;
  onClickDelete: (account: SubAccountViewModel) => void;
}

export function SubAccountCardList({
  accounts,
  activeAccountIdx,
  onClickPermission,
  onClickEdit,
  onClickDelete,
}: SubAccountCardListProps) {
  const { t } = useTranslation("features/manage-sub-accounts");

  return (
    <ul
      aria-label={t("list.label")}
      className="grid grid-cols-1 gap-5 tablet:grid-cols-2 tablet:gap-4"
    >
      {accounts.map((account) => {
        const rows = [
          { key: "name", value: orEmptyValue(account.name) },
          { key: "email", value: orEmptyValue(account.email) },
          {
            key: "createdAt",
            value: account.createdAt
              ? formatListDate(account.createdAt)
              : EMPTY_VALUE,
          },
        ] as const;
        const isActive = account.accountIdx === activeAccountIdx;

        return (
          <li
            key={account.accountIdx}
            className={cn(
              "flex min-w-0 flex-col gap-3 rounded-lg border p-4",
              isActive && "bg-muted",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar size="md">
                {account.profileImageUrl && (
                  <AvatarImage src={account.profileImageUrl} alt="" />
                )}
                <AvatarPlaceholder />
              </Avatar>
              <span className="min-w-0 truncate text-base leading-6 font-medium text-foreground">
                {orEmptyValue(account.identifier)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="min-w-0 flex-1"
                onClick={() => onClickPermission(account)}
              >
                {t("list.action.permission")}
              </Button>
              <EditButton
                label={t("list.action.edit")}
                onClick={() => onClickEdit(account)}
              />
              <DeleteButton
                label={t("list.action.delete")}
                onClick={() => onClickDelete(account)}
              />
            </div>
            <dl className="flex flex-col border-t pt-1">
              {rows.map(({ key, value }) => (
                <div
                  key={key}
                  className="flex min-h-12 items-center justify-between gap-4 text-sm leading-5"
                >
                  <dt className="shrink-0 font-semibold text-foreground">
                    {t(`list.column.${key}`)}
                  </dt>
                  <dd className="min-w-0 truncate text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
