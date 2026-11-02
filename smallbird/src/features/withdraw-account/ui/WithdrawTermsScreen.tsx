import { X } from "lucide-react";

import { SubHeader } from "@/shared/components/app-header";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { WithdrawActions } from "./WithdrawActions";
import { WithdrawTermsBox } from "./WithdrawTermsBox";

interface WithdrawTermsScreenProps {
  onClose: () => void;
  onAgree: () => void;
}

// Figma MO 회원 탈퇴 약관(스펙 §2·§3 회원 탈퇴): 다이얼로그가 아니라 헤더 아래 전체 화면. 서브헤더(제목 + X) · 약관 박스(여백 16) · 하단 고정 버튼 한 쌍.
// 레이아웃 여백(--mypage-gutter)만큼 나가 가장자리까지 채우고, 버튼 줄은 스크롤 컨테이너(<main>) 안에서 sticky로 바닥에 붙임(키보드 대응 JS 없음).
export function WithdrawTermsScreen({
  onClose,
  onAgree,
}: WithdrawTermsScreenProps) {
  const { t } = useTranslation("features/withdraw-account");
  const { t: tCommon } = useTranslation();

  return (
    <div className="-mx-(--mypage-gutter) flex min-h-full flex-col">
      <SubHeader
        className="sticky top-0 z-10"
        title={<h1>{t("title")}</h1>}
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
      <div className="flex-1 p-4">
        <WithdrawTermsBox className="overflow-visible" />
      </div>
      <WithdrawActions
        className="sticky bottom-0 border-t bg-background p-4"
        onClickCancel={onClose}
        onClickAgree={onAgree}
      />
    </div>
  );
}
