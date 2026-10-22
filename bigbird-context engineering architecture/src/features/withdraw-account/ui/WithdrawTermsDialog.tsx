import { X } from "lucide-react";

import { SubHeader } from "@/shared/components/app-header";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";

import { WithdrawActions } from "./WithdrawActions";
import { WithdrawTermsBox } from "./WithdrawTermsBox";

interface WithdrawTermsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** "동의 및 탈퇴하기". 다음 단계(비밀번호 확인·탈퇴)는 호출하는 쪽이 정함. */
  onAgree: () => void;
}

// Figma 회원 탈퇴 약관(PC 10061:207234, TAB 10061:207315): 460×650 중앙 다이얼로그, 딤 있음. 헤더(제목 + X) · 약관 박스 · 버튼 한 쌍.
// 가운데 정렬 기본 다이얼로그가 아니라 시안의 칸 구성(헤더 60, 본문 위 20·아래 12, 버튼 20)이라 직접 짬.
export function WithdrawTermsDialog({
  isOpen,
  onClose,
  onAgree,
}: WithdrawTermsDialogProps) {
  const { t } = useTranslation("features/withdraw-account");
  const { t: tCommon } = useTranslation();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex h-162.5 max-h-[calc(100dvh-2rem)] w-115 max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-115"
      >
        <SubHeader
          title={
            <DialogTitle className="text-base leading-none font-semibold">
              {t("title")}
            </DialogTitle>
          }
          actions={
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost-foreground"
                size="icon"
                aria-label={tCommon("action.close")}
              >
                <X />
              </Button>
            </DialogClose>
          }
        />
        {/* 설명은 본문(약관) 자체라 별도 문구 없이 접근성 연결만 비워 둠. */}
        <DialogDescription className="sr-only" />
        <div className="flex min-h-0 flex-1 flex-col px-5 pt-5 pb-3">
          <WithdrawTermsBox className="flex-1" />
        </div>
        <WithdrawActions
          className="p-5"
          onClickCancel={onClose}
          onClickAgree={onAgree}
        />
      </DialogContent>
    </Dialog>
  );
}
