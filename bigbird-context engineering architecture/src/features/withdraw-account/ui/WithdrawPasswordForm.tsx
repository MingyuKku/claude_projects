import { PasswordInput } from "@/shared/components/form-field";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import type { useWithdrawalForm } from "../lib/use-withdrawal-form";

type WithdrawalForm = ReturnType<typeof useWithdrawalForm>;

interface WithdrawPasswordFormProps {
  form: WithdrawalForm;
  onClickCancel: () => void;
  /** 안내문·입력 영역과 버튼 줄의 클래스(다이얼로그 안쪽 여백 / MO 하단 고정). */
  contentClassName?: string;
  actionsClassName?: string;
  className?: string;
}

// v2 비밀번호 확인 단계: 안내문 "회원정보 탈퇴를 위해 비밀번호를 입력해주세요" + 비밀번호 칸 + 확인 버튼. 칸 아래 오류는 서버가 비밀번호가 다르다고 한 경우만.
// v2는 비밀번호·비밀번호 확인 두 칸이었으나 두 값을 서로 비교하지 않고 뒤 칸만 보냈으므로 v3는 한 칸으로 줄임. 취소 버튼은 v3 다이얼로그 규칙에 맞춰 추가.
export function WithdrawPasswordForm({
  form,
  onClickCancel,
  contentClassName,
  actionsClassName,
  className,
}: WithdrawPasswordFormProps) {
  const { t } = useTranslation("features/withdraw-account");
  const { t: tCommon } = useTranslation();
  const label = tCommon("field.password");

  return (
    <form onSubmit={form.handleSubmit} noValidate className={className}>
      <div className={cn("flex flex-col gap-3", contentClassName)}>
        <p className="text-sm leading-5 text-foreground">
          {t("password.description")}
        </p>
        <div className="flex flex-col gap-2">
          <PasswordInput
            autoComplete="current-password"
            aria-label={label}
            aria-invalid={form.isWrong || undefined}
            aria-describedby={
              form.isWrong ? "withdraw-password-error" : undefined
            }
            disabled={form.isSubmitting}
            value={form.password}
            onChange={form.handleChangePassword}
            showLabel={tCommon("password.show", { label })}
            hideLabel={tCommon("password.hide", { label })}
          />
          {form.isWrong && (
            <p
              id="withdraw-password-error"
              role="alert"
              className="text-sm leading-5 font-medium text-destructive"
            >
              {t("password.error.mismatch")}
            </p>
          )}
        </div>
      </div>
      <div className={cn("flex items-center gap-2", actionsClassName)}>
        <Button
          type="button"
          variant="outline-foreground"
          className="flex-1"
          disabled={form.isSubmitting}
          onClick={onClickCancel}
        >
          {tCommon("action.cancel")}
        </Button>
        <Button
          type="submit"
          destructive
          className="flex-1"
          disabled={!form.canSubmit || form.isSubmitting}
        >
          {t("password.submit")}
        </Button>
      </div>
    </form>
  );
}
