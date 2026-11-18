import { X } from "lucide-react";
import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";

import { SubHeader } from "@/shared/components/app-header";
import { PasswordInput } from "@/shared/components/form-field";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";

import type { FormEvent } from "react";

interface PasswordConfirmDialogProps {
  open: boolean;
  /** 입력한 비밀번호가 맞으면 true. 요청이 실패하면 던지면 오류 토스트를 띄움. */
  onSubmit: (password: string) => Promise<boolean>;
  onConfirmed: () => void;
  onClose: () => void;
}

// Figma 관리자 비밀번호 입력(10724:185484): 보기·수정 구조의 "수정"을 누르면 본인 확인으로 띄움. 문구는 모든 화면이 같아 common에서 가져옴.
export function PasswordConfirmDialog({
  open,
  onSubmit,
  onConfirmed,
  onClose,
}: PasswordConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex w-115 max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-115"
      >
        {/* 닫히면 내용이 사라져 입력·오류 상태도 함께 초기화됨. */}
        <PasswordConfirmContent
          onSubmit={onSubmit}
          onConfirmed={onConfirmed}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function PasswordConfirmContent({
  onSubmit,
  onConfirmed,
  onClose,
}: Omit<PasswordConfirmDialogProps, "open">) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [isWrong, setIsWrong] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const label = t("field.password");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!password || isSubmitting) return;
    setIsSubmitting(true);
    const [error, isMatched] = await tryit(onSubmit)(password);
    setIsSubmitting(false);
    if (error) {
      toast.error(t("error.unexpected"));
      return;
    }
    if (!isMatched) {
      setIsWrong(true);
      return;
    }
    onConfirmed();
  }

  return (
    <>
      <SubHeader
        title={
          <DialogTitle className="text-base leading-none font-semibold">
            {t("passwordConfirm.title")}
          </DialogTitle>
        }
        actions={
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost-foreground"
              size="icon"
              aria-label={t("action.close")}
              disabled={isSubmitting}
            >
              <X />
            </Button>
          </DialogClose>
        }
      />
      <DialogDescription className="sr-only" />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col">
        <div className="flex flex-col gap-2 px-5 pt-5">
          <PasswordInput
            autoComplete="current-password"
            aria-label={label}
            aria-invalid={isWrong || undefined}
            aria-describedby={isWrong ? "password-confirm-error" : undefined}
            placeholder={t("passwordConfirm.placeholder")}
            disabled={isSubmitting}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setIsWrong(false);
            }}
            showLabel={t("password.show", { label })}
            hideLabel={t("password.hide", { label })}
          />
          {isWrong && (
            <p
              id="password-confirm-error"
              role="alert"
              className="text-sm leading-5 font-medium text-destructive"
            >
              {t("passwordConfirm.mismatch")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 p-5 pt-6">
          <Button
            type="button"
            variant="outline-foreground"
            className="flex-1"
            disabled={isSubmitting}
            onClick={onClose}
          >
            {t("action.cancel")}
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={!password || isSubmitting}
          >
            {t("action.confirm")}
          </Button>
        </div>
      </form>
    </>
  );
}
