import { EmptyTableFrame } from "@/shared/components/list-filter";
import { formatListDate, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { DeleteButton } from "./DeleteButton";
import { EditButton } from "./EditButton";

import type { SubAccountViewModel } from "../model/types";
import type { ReactNode } from "react";

interface SubAccountTableProps {
  accounts: SubAccountViewModel[];
  /** 권한 부여를 열어 둔 Sub ID. 그 행을 활성(accent) 처리함. */
  activeAccountIdx: number | null;
  onClickPermission: (account: SubAccountViewModel) => void;
  onClickEdit: (account: SubAccountViewModel) => void;
  onClickDelete: (account: SubAccountViewModel) => void;
  /** 0건·검색 결과 없음처럼 표 본문 자리에 그릴 내용. 있으면 행 대신 그림. */
  emptyContent?: ReactNode;
}

// 표는 PC(1440~)만 씀(TAB·MO는 카드). 긴 값은 두 줄까지 줄바꿈 뒤 말줄임, PC 시안(패널이 열려 표가 좁아진 경우)에서는 한 줄 말줄임.
// 글자 단위로 줄바꿈(break-all)해 칸이 얼마든 좁아질 수 있게 둠. 그래야 자동 표 배치에서 이 열들이 남는 폭에 맞춰 줄고,
// 줄일 수 없는 열(관리 버튼)은 내용 폭을 지켜 셀 밖으로 넘치지 않음.
const CELL_TEXT_CLASS_NAME = "line-clamp-2 break-all desktop:line-clamp-1";

// Figma Sub ID 목록 표(10061:201222): Header Gray, 열 폭 아이디 가변·담당자명(표 폭의 약 1/8: 1170→150, 773→100, 672→81)·이메일 가변·생성일 120·관리 184, 행 높이 56.
// 고정 폭(table-fixed)을 쓰지 않음: 긴 언어에서 관리 버튼이 184보다 넓어지면 셀 밖으로 넘쳐 표 배경·선이 끊김. 자동 배치에서
// 지정한 폭은 최소 폭이 되어 시안 폭을 지키고, 내용이 더 넓으면 열이 늘어나 그래도 좁으면 표가 가로로 스크롤됨.
export function SubAccountTable({
  accounts,
  activeAccountIdx,
  onClickPermission,
  onClickEdit,
  onClickDelete,
  emptyContent,
}: SubAccountTableProps) {
  const { t } = useTranslation("features/manage-sub-accounts");

  const header = (
    <TableHeader>
      <TableRow>
        <TableHead>{t("list.column.identifier")}</TableHead>
        <TableHead className="w-1/8">{t("list.column.name")}</TableHead>
        <TableHead>{t("list.column.email")}</TableHead>
        <TableHead className="w-30">{t("list.column.createdAt")}</TableHead>
        <TableHead className="w-46">{t("list.column.manage")}</TableHead>
      </TableRow>
    </TableHeader>
  );

  if (emptyContent) {
    return (
      <EmptyTableFrame
        table={
          <Table
            headerTone="gray"
            aria-label={t("list.label")}
            containerClassName="rounded-none border-0"
          >
            {header}
          </Table>
        }
      >
        {emptyContent}
      </EmptyTableFrame>
    );
  }

  return (
    <Table headerTone="gray" aria-label={t("list.label")}>
      {header}
      <TableBody>
        {accounts.map((account) => (
          <TableRow
            key={account.accountIdx}
            data-state={
              account.accountIdx === activeAccountIdx ? "selected" : undefined
            }
          >
            <TableCell className="whitespace-normal">
              <div className="flex items-center gap-3">
                <Avatar size="md">
                  {account.profileImageUrl && (
                    <AvatarImage src={account.profileImageUrl} alt="" />
                  )}
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
              {account.createdAt ? formatListDate(account.createdAt) : ""}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-6">
                <Button
                  variant="outline"
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
