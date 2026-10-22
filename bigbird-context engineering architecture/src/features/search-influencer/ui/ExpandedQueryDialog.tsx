import { Minimize2, Search } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState } from "react";

import { fieldTextareaClassName } from "@/shared/components/text-field";
import { useTranslation } from "@/shared/i18n";
import { useVisualViewport } from "@/shared/lib/useVisualViewport";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

import { focusTextareaAtEnd } from "../lib/focus-textarea-at-end";
import { PlatformSelect } from "./PlatformSelect";

import type { InfluencerPlatform } from "@/entities/platform";
import type { ChangeEvent, KeyboardEvent, RefObject } from "react";

interface ExpandedQueryDialogProps {
  /** 모달 상자가 가로 위치와 폭을 맞출 기존 입력창. */
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  query: string;
  maxLength: number;
  platform?: InfluencerPlatform;
  canSubmit: boolean;
  onChangeQuery: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDownQuery: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onChangePlatform: (platform: InfluencerPlatform) => void;
  onSubmitQuery: () => void;
  onCloseDialog: () => void;
  /** 닫힌 뒤 기존 입력창으로 포커스를 돌려줌. */
  onFocusQueryOnClose: () => void;
}

// 긴 글을 펼쳐 쓰는 입력창(specs/home.md §3 "긴 글 펼치기"). 기존 입력창은 DOM에 그대로 두고 같은 값을 보여 주는 두 번째 화면.
// 헤더를 포함한 화면 전체를 덮고, 키보드가 떠 있으면 보이는 영역(visualViewport)에 높이를 맞춤.
export function ExpandedQueryDialog({
  anchorRef,
  open,
  query,
  maxLength,
  platform,
  canSubmit,
  onChangeQuery,
  onKeyDownQuery,
  onChangePlatform,
  onSubmitQuery,
  onCloseDialog,
  onFocusQueryOnClose,
}: ExpandedQueryDialogProps) {
  const { t } = useTranslation("features/search-influencer");
  const textareaId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const viewport = useVisualViewport();
  const [anchor, setAnchor] = useState<{ left: number; width: number }>();

  // 모달은 화면 전체를 덮어 중앙 정렬하면 사이드바만큼 기존 입력창과 어긋나 아래 입력창이 비침.
  // 열려 있는 동안 기존 입력창의 가로 위치·폭을 그대로 따름.
  useLayoutEffect(() => {
    if (!open) return;

    function measure() {
      const rect = anchorRef.current?.getBoundingClientRect();
      setAnchor(
        rect && rect.width > 0
          ? { left: rect.left, width: rect.width }
          : undefined,
      );
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, anchorRef]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCloseDialog();
      }}
    >
      <DialogContent
        showCloseButton={false}
        // 디자인 시스템 Dimmed(5084:115872) Light = foreground 10%
        overlayClassName="bg-foreground/10"
        aria-describedby={undefined}
        style={
          viewport
            ? { top: viewport.offsetTop, height: viewport.height }
            : undefined
        }
        className={cn(
          "top-0 left-0 flex h-dvh max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-transparent px-0 py-4 shadow-none sm:max-w-none",
        )}
        onOpenAutoFocus={(event) => {
          // iOS는 탭 이벤트 안에서 동기적으로 focus해야 키보드가 유지됨.
          event.preventDefault();
          focusTextareaAtEnd(textareaRef.current);
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onFocusQueryOnClose();
        }}
      >
        <DialogTitle className="sr-only">{t("query.placeholder")}</DialogTitle>
        <div
          style={
            anchor
              ? {
                  marginLeft: anchor.left,
                  marginRight: 0,
                  width: anchor.width,
                  maxWidth: "none",
                }
              : undefined
          }
          className="mx-4 flex min-h-0 w-[calc(100%-2rem)] flex-none flex-col gap-1.5 rounded-md border border-input bg-background px-3 py-2.5 shadow-lg tablet:mx-auto tablet:w-full tablet:max-w-158 desktop:max-w-174.5"
        >
          <div className="flex min-h-0 flex-1 items-start">
            <textarea
              id={textareaId}
              ref={textareaRef}
              name="q-expanded"
              value={query}
              maxLength={maxLength}
              aria-label={t("query.placeholder")}
              placeholder={t("query.placeholder")}
              onChange={onChangeQuery}
              onKeyDown={onKeyDownQuery}
              className={cn(
                fieldTextareaClassName,
                "h-full [scrollbar-gutter:stable] overflow-y-auto",
              )}
            />
            <Button
              type="button"
              variant="ghost-foreground"
              size="icon-xs"
              aria-label={t("expand.close")}
              onClick={onCloseDialog}
            >
              <Minimize2 />
            </Button>
          </div>
          <div className="flex w-full items-center justify-between gap-4">
            <PlatformSelect value={platform} onChange={onChangePlatform} />
            <Button
              type="button"
              size="sm"
              disabled={!canSubmit}
              onClick={onSubmitQuery}
            >
              <Search />
              {t("submit")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
