import closeX from "@/shared/assets/img/system/close-x.svg";
import warningTriangle from "@/shared/assets/img/system/warning-triangle.svg";
import { cn } from "@/shared/lib";

import { AuthButton } from "./AuthButton";
import { AuthText } from "./AuthText";

import type { ReactNode } from "react";

/**
 * Auth-screen alert popup.
 *
 * shadcn `alert-dialog` is not used because its size and colors are bound to
 * the product tokens (slate). Accessibility is filled in by hand instead:
 * role="alertdialog" and aria-labelledby let screen readers read the title.
 */

const TITLE_ID = "alert-popup-title";

interface AlertPopupProps {
  title: string;
  message: ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  onClickCancel?: () => void;
  onClickConfirm: () => void;
  hideCloseButton?: boolean;
  className?: string;
}

export function AlertPopup({
  title,
  message,
  cancelLabel,
  confirmLabel,
  onClickCancel,
  onClickConfirm,
  hideCloseButton = false,
  className,
}: AlertPopupProps) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-dark/60">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className={cn(
          "flex w-80 flex-col items-start rounded-xl bg-light p-5 shadow-normal",
          className,
        )}
      >
        {!hideCloseButton && (
          <button
            type="button"
            aria-label="닫기"
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
              <AuthText
                id={TITLE_ID}
                size="xl"
                weight="medium"
                className="text-xl!"
              >
                {title}
              </AuthText>
              <AuthText size="md" className="text-base!">
                {message}
              </AuthText>
            </div>
          </div>
          <div className="flex w-full items-center gap-2">
            {cancelLabel && (
              <div className="h-12 flex-1">
                <AuthButton color="light" onClick={onClickCancel}>
                  <AuthText
                    as="span"
                    size="md"
                    className="text-base! text-inherit!"
                  >
                    {cancelLabel}
                  </AuthText>
                </AuthButton>
              </div>
            )}
            <div className="h-12 flex-1">
              <AuthButton color="primary" onClick={onClickConfirm}>
                <AuthText
                  as="span"
                  size="md"
                  className="text-base! text-inherit!"
                >
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
