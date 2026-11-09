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

import type { PolicyItem } from "../../../model/policy-items";

interface PolicyTermsDialogProps {
  /** 열려 있는 약관. 없으면 닫힘. */
  item: PolicyItem | null;
  onClose: () => void;
  /** "동의하기": 그 항목을 켜고 닫는 일은 호출하는 쪽이 정함. */
  onAgree: (item: PolicyItem) => void;
}

// 약관 전문(Figma Filter Dialog 7841:401352·7803:326225: 460×650 중앙 다이얼로그, MO는 전체 화면 서브 화면 7841:409358).
// 헤더 제목 + ×, 스크롤 본문 박스, 하단 "취소"(닫기만)·"동의하기"(켜고 닫기).
export function PolicyTermsDialog({
  item,
  onClose,
  onAgree,
}: PolicyTermsDialogProps) {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();
  const kind = item?.termsKind;

  return (
    <Dialog
      open={item !== null && kind !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex h-dvh max-h-dvh w-full max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 max-tablet:inset-0 max-tablet:translate-x-0 max-tablet:translate-y-0 tablet:h-162.5 tablet:max-h-[calc(100dvh-2rem)] tablet:w-115 tablet:max-w-[calc(100%-2rem)] tablet:rounded-lg tablet:border sm:max-w-none tablet:sm:max-w-115"
      >
        <SubHeader
          title={
            <DialogTitle className="text-base leading-none font-semibold">
              {item ? t(`policy.items.${item.key}.title`) : ""}
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
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto rounded-md border border-input bg-background p-4">
            {kind && <TermsDocument kind={kind} />}
          </div>
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
            onClick={() => item && onAgree(item)}
          >
            {t("policy.agree")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
