import { formatDate, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { DATE_FORMAT } from "../model/constants";
import { DeleteButton } from "./DeleteButton";

import type { SubAccountViewModel } from "../model/types";
import type { ReactNode } from "react";

interface SubAccountTableProps {
  accounts: SubAccountViewModel[];
  /** 권한 부여를 열어 둔 Sub ID. 그 행을 활성(accent) 처리함. */
  activeAccountIdx: number | null;
  onClickPermission: (account: SubAccountViewModel) => void;
  onClickDelete: (account: SubAccountViewModel) => void;
  /** 0건·검색 결과 없음처럼 표 본문 자리에 그릴 내용. 있으면 행 대신 그림. */
  emptyContent?: ReactNode;
}

// 긴 값은 TAB 시안에서는 두 줄까지 줄바꿈 뒤 말줄임, PC 시안(패널이 열려 표가 좁아진 경우)에서는 한 줄 말줄임.
const CELL_TEXT_CLASS_NAME =
  "line-clamp-2 break-all desktop:line-clamp-none desktop:block desktop:truncate desktop:break-normal";

// Figma Sub ID 목록 표(10061:201222): Header Gray, 열 폭 아이디 가변·담당자명(표 폭의 약 1/8: 1170→150, 773→100, 672→81)·이메일 가변·생성일 120·관리 184, 행 높이 56.
export function SubAccountTable({
  accounts,
  activeAccountIdx,
  onClickPermission,
  onClickDelete,
  emptyContent,
}: SubAccountTableProps) {
  const { t } = useTranslation("features/manage-sub-accounts");

  return (
    <Table
      headerTone="gray"
      className="table-fixed"
      aria-label={t("list.label")}
    >
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>{t("list.column.identifier")}</TableHead>
          <TableHead className="w-1/8">{t("list.column.name")}</TableHead>
          <TableHead>{t("list.column.email")}</TableHead>
          <TableHead className="w-30">{t("list.column.createdAt")}</TableHead>
          <TableHead className="w-46">{t("list.column.manage")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {emptyContent ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={5} className="h-auto p-0 whitespace-normal">
              {emptyContent}
            </TableCell>
          </TableRow>
        ) : (
          accounts.map((account) => (
            <TableRow
              key={account.accountIdx}
              data-state={
                account.accountIdx === activeAccountIdx ? "selected" : undefined
              }
            >
              <TableCell className="whitespace-normal">
                <div className="flex items-center gap-3">
                  <Avatar size="md">
                    <AvatarPlaceholder />
                  </Avatar>
                  <span className={cn(CELL_TEXT_CLASS_NAME, "min-w-0 flex-1")}>
                    {account.identifier}
                  </span>
                </div>
              </TableCell>
              <TableCell className="whitespace-normal">
                <span className={CELL_TEXT_CLASS_NAME}>{account.name}</span>
              </TableCell>
              <TableCell className="whitespace-normal">
                <span className={CELL_TEXT_CLASS_NAME}>{account.email}</span>
              </TableCell>
              <TableCell className="truncate">
                {formatDate(account.createdAt, DATE_FORMAT)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-8">
                  <Button
                    variant="outline"
                    onClick={() => onClickPermission(account)}
                  >
                    {t("list.action.permission")}
                  </Button>
                  <DeleteButton
                    label={t("list.action.delete")}
                    onClick={() => onClickDelete(account)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
