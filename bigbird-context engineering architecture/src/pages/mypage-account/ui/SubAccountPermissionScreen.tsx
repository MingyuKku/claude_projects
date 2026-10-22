import { X } from "lucide-react";

import { SubAccountPermissionSections } from "@/features/manage-sub-accounts";
import { SubHeader } from "@/shared/components/app-header";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

interface SubAccountPermissionScreenProps {
  onClose: () => void;
}

// MO의 권한 부여는 탭 줄 아래 서브 화면(서브헤더 "권한 부여" + X, 시안 10061:206662). 레이아웃 여백(--mypage-gutter)만큼 나가
// 가장자리까지 채우고, 서브헤더가 탭 줄 바로 아래에 붙도록 Tabs의 gap(16px)만큼 올림.
export function SubAccountPermissionScreen({
  onClose,
}: SubAccountPermissionScreenProps) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const { t: tCommon } = useTranslation();

  return (
    <div className="-mx-(--mypage-gutter) -mt-4 flex flex-col">
      <SubHeader
        className="sticky top-0 z-0"
        title={t("access.screen")}
        actions={
          <Button
            type="button"
            variant="ghost-foreground"
            size="icon"
            aria-label={tCommon("action.close")}
            onClick={onClose}
          >
            <X />
          </Button>
        }
      />
      <div className="px-(--mypage-gutter) py-4">
        <SubAccountPermissionSections />
      </div>
    </div>
  );
}
