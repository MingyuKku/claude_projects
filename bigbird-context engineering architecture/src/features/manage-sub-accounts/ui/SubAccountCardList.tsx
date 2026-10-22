import { formatDate, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";

import { DATE_FORMAT } from "../model/constants";
import { DeleteButton } from "./DeleteButton";

import type { SubAccountViewModel } from "../model/types";

interface SubAccountCardListProps {
  accounts: SubAccountViewModel[];
  activeAccountIdx: number | null;
  onClickPermission: (account: SubAccountViewModel) => void;
  onClickDelete: (account: SubAccountViewModel) => void;
}

// Figma MO 카드(10061:206551): 위쪽에 권한 부여·삭제 버튼(오른쪽 정렬), 아래에 라벨 열(회색)·값 열 표.
export function SubAccountCardList({
  accounts,
  activeAccountIdx,
  onClickPermission,
  onClickDelete,
}: SubAccountCardListProps) {
  const { t } = useTranslation("features/manage-sub-accounts");

  return (
    <ul aria-label={t("list.label")} className="flex flex-col gap-5">
      {accounts.map((account) => {
        const rows = [
          {
            key: "identifier",
            value: (
              <span className="flex min-w-0 items-center gap-3">
                <Avatar size="sm">
                  <AvatarPlaceholder />
                </Avatar>
                <span className="truncate">{account.identifier}</span>
              </span>
            ),
          },
          { key: "name", value: account.name },
          { key: "email", value: account.email },
          {
            key: "createdAt",
            value: formatDate(account.createdAt, DATE_FORMAT),
          },
        ] as const;
        const isActive = account.accountIdx === activeAccountIdx;

        return (
          <li key={account.accountIdx} className="flex flex-col gap-2">
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                className="w-27.75"
                onClick={() => onClickPermission(account)}
              >
                {t("list.action.permission")}
              </Button>
              <DeleteButton
                label={t("list.action.delete")}
                onClick={() => onClickDelete(account)}
              />
            </div>
            <dl
              className={cn(
                "grid grid-cols-[max-content_minmax(0,1fr)] overflow-hidden rounded-lg border",
                isActive && "bg-muted",
              )}
            >
              {rows.map(({ key, value }) => (
                <div key={key} className="contents">
                  <dt className="flex h-12 items-center border-b bg-muted/40 px-4 text-sm leading-6 font-medium text-muted-foreground [div:last-child>&]:border-b-0">
                    {t(`list.column.${key}`)}
                  </dt>
                  <dd className="flex h-12 min-w-0 items-center border-b px-4 text-sm leading-5 text-foreground [div:last-child>&]:border-b-0">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
