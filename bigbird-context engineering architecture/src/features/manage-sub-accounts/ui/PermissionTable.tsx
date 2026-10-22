import { useTranslation } from "@/shared/i18n";
import { Switch } from "@/shared/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { useCodeLabel } from "../lib/use-code-label";

import type { SubAccountPermission } from "../model/types";

interface PermissionTableProps {
  permissions: SubAccountPermission[];
  /** 스위치를 바꿀 때마다 바로 저장함(저장 버튼 없음). 반영 여부는 호출하는 쪽이 정하고 스위치는 받은 값만 보임. */
  onChangePermission: (key: string, next: boolean) => void;
}

// Figma Sub ID 권한부여 표(10061:201563): 권한명 | 권한 여부(Switch sm), Header Gray, 행 높이 56. 항목은 서버 목록 그대로.
export function PermissionTable({
  permissions,
  onChangePermission,
}: PermissionTableProps) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const label = useCodeLabel();

  return (
    <Table headerTone="gray" aria-label={t("access.permission.title")}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-1/2">
            {t("access.permission.column.name")}
          </TableHead>
          <TableHead className="w-1/2">
            {t("access.permission.column.granted")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {permissions.map((permission) => {
          const name = label.permission(permission.key, permission.name);
          return (
            <TableRow key={permission.key}>
              <TableCell>{name}</TableCell>
              <TableCell>
                <Switch
                  size="sm"
                  checked={permission.isGranted}
                  aria-label={t("access.permission.switchLabel", { name })}
                  onCheckedChange={(next) =>
                    onChangePermission(permission.key, next)
                  }
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
