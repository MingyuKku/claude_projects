import { X } from "lucide-react";

import { TermsDocument } from "@/entities/terms";
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
import { ScrollArea } from "@/shared/ui/scroll-area";

interface ChargeTermsDialogProps {
  isOpen: boolean;
  /** 결제 요청이 진행 중이면 동의 버튼을 막아 중복 요청을 피함. */
  isAgreeing: boolean;
  onClose: () => void;
  /** "동의 및 충전하기". 결제창 열기는 호출하는 쪽이 정함. */
  onAgree: () => void;
}

// 회원 탈퇴 약관 다이얼로그(460×650 중앙, 헤더 + X + 약관 박스 + 하단 버튼 한 쌍)와 같은 구성.
export function ChargeTermsDialog({
  isOpen,
  isAgreeing,
  onClose,
  onAgree,
}: ChargeTermsDialogProps) {
  const { t } = useTranslation("features/charge-bigbird-money");
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
              {t("terms.title")}
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
          {/* 약관 박스의 스크롤바는 회원 탈퇴 약관과 같이 시안의 Scroll-area라서 `ScrollArea`로 그림(겹쳐서 자리를 차지하지 않음). Radix 안쪽 래퍼(display: table)는 긴 글을 줄바꿈하지 않아 block으로 되돌림. */}
          <ScrollArea
            type="auto"
            className="min-h-0 flex-1 rounded-md border border-input bg-background [&_[data-slot=scroll-area-viewport]>div]:block!"
          >
            <div className="flex flex-col gap-5 p-4">
              <TermsDocument kind="charge" />
            </div>
          </ScrollArea>
        </div>
        <div className="flex items-center gap-2 p-5">
          <Button
            type="button"
            variant="outline-foreground"
            className="flex-1"
            onClick={onClose}
          >
            {tCommon("action.cancel")}
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={isAgreeing}
            onClick={onAgree}
          >
            {t("terms.agree")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
