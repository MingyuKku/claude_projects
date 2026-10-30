import { useTranslation } from "@/shared/i18n";
import { Switch } from "@/shared/ui/switch";

import { useCodeLabel } from "../lib/use-code-label";

import type { ApiPermissionKey, SubAccountPermission } from "../model/types";

interface PermissionSwitchListProps {
  permissions: SubAccountPermission[];
  /** 스위치를 바꿀 때마다 바로 저장함(저장 버튼 없음). 반영 여부는 호출하는 쪽이 정하고 스위치는 받은 값만 보임. */
  onChangePermission: (key: ApiPermissionKey, next: boolean) => void;
}

// Figma 서비스 권한(10724:186486): 권한명 | Switch 행 목록, 행 높이 48, 표 머리글·테두리 없음. 항목은 서버가 주는 권한만.
export function PermissionSwitchList({
  permissions,
  onChangePermission,
}: PermissionSwitchListProps) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const label = useCodeLabel();

  return (
    <ul aria-label={t("access.permission.title")} className="flex flex-col">
      {permissions.map((permission) => {
        const name = label.permission(permission.key);
        return (
          <li
            key={permission.key}
            className="flex min-h-12 items-center justify-between gap-3 text-sm leading-5 text-foreground"
          >
            {name}
            <Switch
              checked={permission.isGranted}
              aria-label={t("access.permission.switchLabel", { name })}
              onCheckedChange={(next) =>
                onChangePermission(permission.key, next)
              }
            />
          </li>
        );
      })}
    </ul>
  );
}
