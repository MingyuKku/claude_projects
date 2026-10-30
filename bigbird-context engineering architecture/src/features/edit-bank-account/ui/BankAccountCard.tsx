import { useState } from "react";

import { verifyCurrentPassword } from "@/entities/account";
import { PasswordConfirmDialog } from "@/shared/components/password-confirm-dialog";

import { BankAccountForm } from "./BankAccountForm";
import { BankAccountView } from "./BankAccountView";

import type { BankAccountViewModel } from "../model/schema";

interface BankAccountCardProps {
  /** 등록된 계좌. 아직 없으면 null. */
  account: BankAccountViewModel | null;
  banks: { idx: number; name: string }[];
  /** 계좌 정보가 서버에 반영된 뒤 호출. 화면이 정보를 다시 읽음. */
  onSaved: () => void;
}

// 계좌정보는 보기 → "수정"(미등록은 "등록") → 관리자 비밀번호 확인 → 입력 모드 → 취소·저장(Figma 10724:185992·185944). 들어갈 때마다 비밀번호를 다시 물음.
export function BankAccountCard({
  account,
  banks,
  onSaved,
}: BankAccountCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  if (isEditing) {
    return (
      <BankAccountForm
        account={account}
        banks={banks}
        onSaved={onSaved}
        onFinishEdit={() => setIsEditing(false)}
      />
    );
  }

  return (
    <>
      <BankAccountView
        account={account}
        onClickEdit={() => setIsConfirming(true)}
      />
      <PasswordConfirmDialog
        open={isConfirming}
        onSubmit={verifyCurrentPassword}
        onConfirmed={() => {
          setIsConfirming(false);
          setIsEditing(true);
        }}
        onClose={() => setIsConfirming(false)}
      />
    </>
  );
}
