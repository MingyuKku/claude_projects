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

import type { ViewTermsKind } from "../model/types";

const TITLE_KEY = {
  privacy: "link.privacy",
  service: "link.terms",
} as const;

interface TermsDialogProps {
  kind: ViewTermsKind;
  isOpen: boolean;
  onClose: () => void;
}

/** 약관 전문을 읽기만 하는 창. 태블릿 이상은 가운데 다이얼로그, 모바일은 전체 화면. */
export function TermsDialog({ kind, isOpen, onClose }: TermsDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-0 left-0 flex h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 tablet:top-1/2 tablet:left-1/2 tablet:h-162.5 tablet:max-h-[calc(100dvh-2rem)] tablet:w-115 tablet:max-w-115 tablet:-translate-x-1/2 tablet:-translate-y-1/2 tablet:rounded-lg tablet:border sm:max-w-none"
      >
        <SubHeader
          title={
            <DialogTitle className="ds-text-base-none-semibold">
              {t(TITLE_KEY[kind])}
            </DialogTitle>
          }
          actions={
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost-foreground"
                size="icon"
                aria-label={t("action.close")}
                className="tablet:size-12 tablet:[&_svg]:size-6"
              >
                <X />
              </Button>
            </DialogClose>
          }
        />
        {/* 설명은 본문(약관) 자체라 별도 문구 없이 접근성 연결만 비워 둠. */}
        <DialogDescription className="sr-only" />
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-4 pb-4 tablet:px-5 tablet:pt-5 tablet:pb-3">
          {/* Radix 스크롤 영역 안쪽 래퍼(display: table)는 긴 글을 줄바꿈하지 않아 block으로 되돌림. */}
          <ScrollArea
            type="auto"
            className="min-h-0 flex-1 rounded-md border border-input bg-background [&_[data-slot=scroll-area-viewport]>div]:block!"
          >
            <div className="flex flex-col ds-gap-5 p-4">
              <TermsDocument kind={kind} />
            </div>
          </ScrollArea>
        </div>
        {/* 모바일은 전체 화면이라 닫기(X)만 두고, 읽기 전용이라 취소·확인 모두 닫기만 함. */}
        <div className="hidden items-center gap-2 p-5 tablet:flex">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            {t("action.cancel")}
          </Button>
          <Button type="button" className="flex-1" onClick={onClose}>
            {t("action.confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
