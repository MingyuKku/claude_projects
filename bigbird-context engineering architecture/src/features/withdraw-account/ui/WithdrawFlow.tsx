import { useState } from "react";
import { toast } from "sonner";

import { useLogout } from "@/entities/session";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { hardNavigate } from "@/shared/lib";

import { useWithdrawalForm } from "../lib/use-withdrawal-form";
import { WithdrawDoneDialog } from "./WithdrawDoneDialog";
import { WithdrawPasswordDialog } from "./WithdrawPasswordDialog";
import { WithdrawPasswordScreen } from "./WithdrawPasswordScreen";
import { WithdrawTermsDialog } from "./WithdrawTermsDialog";
import { WithdrawTermsScreen } from "./WithdrawTermsScreen";

type WithdrawStep = "terms" | "password" | "done";

interface WithdrawFlowProps {
  /** PC·TAB은 중앙 다이얼로그, MO는 전체 화면. */
  variant: "dialog" | "screen";
  onClose: () => void;
}

// 회원 탈퇴 흐름: 약관 → 비밀번호 확인(`POST /check/pw`) → 탈퇴(`PUT /exit`) → 완료 안내 → 로그아웃(스펙 §3, v2와 같은 순서).
// 열릴 때마다 약관부터 시작하도록 부모가 열린 동안만 그림. 비밀번호 단계는 URL에 남기지 않음(새로고침하면 약관부터).
export function WithdrawFlow({ variant, onClose }: WithdrawFlowProps) {
  const { t } = useTranslation("features/withdraw-account");
  const [step, setStep] = useState<WithdrawStep>("terms");
  const { trigger: logout, isMutating: isLoggingOut } = useLogout();

  const form = useWithdrawalForm({
    onDone: () => setStep("done"),
    onFailed: () => toast.error(t("password.error.failed")),
  });

  async function handleConfirmDone() {
    // 탈퇴가 끝난 계정이라 로그아웃 요청이 실패해도 로그인 화면으로 보냄(v2는 성공·실패와 상관없이 이동).
    try {
      await logout();
    } catch (error) {
      console.error("탈퇴 뒤 로그아웃 요청 실패", error);
    }
    // 재로드하여 탈퇴한 계정의 서버 캐시와 진행 중 요청을 함께 정리함.
    hardNavigate(ROUTES.login);
  }

  if (step === "done") {
    return (
      <WithdrawDoneDialog
        isConfirming={isLoggingOut}
        onConfirm={() => void handleConfirmDone()}
      />
    );
  }

  const handleAgree = () => setStep("password");

  if (variant === "screen") {
    return step === "terms" ? (
      <WithdrawTermsScreen onClose={onClose} onAgree={handleAgree} />
    ) : (
      <WithdrawPasswordScreen form={form} onClose={onClose} />
    );
  }

  return step === "terms" ? (
    <WithdrawTermsDialog isOpen onClose={onClose} onAgree={handleAgree} />
  ) : (
    <WithdrawPasswordDialog form={form} onClose={onClose} />
  );
}
