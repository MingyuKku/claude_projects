import closeX from "@/shared/assets/img/system/close-x.svg";
import warningTriangle from "@/shared/assets/img/system/warning-triangle.svg";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { AuthButton } from "./AuthButton";
import { AuthText } from "./AuthText";

import type { ReactNode } from "react";

/**
 * 인증 화면 경고 팝업.
 *
 * shadcn `alert-dialog`는 크기와 색이 상품 토큰(slate)에 묶여 있어 쓰지 않음.
 * 접근성은 직접 채움: role="alertdialog"와 aria-labelledby로
 * 스크린 리더가 제목을 읽음.
 */

const TITLE_ID = "alert-popup-title";

interface AlertPopupProps {
  title: string;
  message: ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  onClickCancel?: () => void;
  onClickConfirm: () => void;
  isCloseButtonHidden?: boolean;
  className?: string;
}

export function AlertPopup({
  title,
  message,
  cancelLabel,
  confirmLabel,
  onClickCancel,
  onClickConfirm,
  isCloseButtonHidden = false,
  className,
}: AlertPopupProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-dark/60">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className={cn(
          "flex w-80 flex-col items-start rounded-auth-xl bg-light p-5 shadow-normal",
          className,
        )}
      >
        {!isCloseButtonHidden && (
          <button
            type="button"
            aria-label={t("action.close")}
            onClick={onClickCancel ?? onClickConfirm}
            className="flex w-full justify-end"
          >
            <span className="flex size-6 items-center justify-center">
              <img src={closeX} alt="" className="size-4" />
            </span>
          </button>
        )}
        <div className="flex w-full flex-col items-start gap-6">
          <div className="flex w-full flex-col items-center gap-3">
            <img src={warningTriangle} alt="" className="size-[42px]" />
            <div className="flex w-full flex-col items-center gap-2 text-center">
              <AuthText id={TITLE_ID} size="fixed-xl" weight="medium">
                {title}
              </AuthText>
              <AuthText size="fixed-base">{message}</AuthText>
            </div>
          </div>
          <div className="flex w-full items-center gap-2">
            {cancelLabel && (
              <div className="h-12 flex-1">
                <AuthButton color="light" onClick={onClickCancel}>
                  <AuthText as="span" size="fixed-base" tone="inherit">
                    {cancelLabel}
                  </AuthText>
                </AuthButton>
              </div>
            )}
            <div className="h-12 flex-1">
              <AuthButton color="primary" onClick={onClickConfirm}>
                <AuthText as="span" size="fixed-base" tone="inherit">
                  {confirmLabel}
                </AuthText>
              </AuthButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
