import { useNavigate } from "react-router";

import { ChangePasswordForm } from "@/features/change-password";
import { AuthHeader } from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";

export function ChangePasswordPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-dvh flex-col items-center bg-background">
      <title>비밀번호 변경</title>
      <AuthHeader title="비밀번호 변경" onClickBack={() => navigate(-1)} />
      <ChangePasswordForm
        className="items-center"
        onClickLogin={() => navigate(ROUTES.login)}
      />
    </main>
  );
}
