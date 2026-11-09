import { useState } from "react";

import { verifyCurrentPassword } from "@/entities/account";
import { PasswordConfirmDialog } from "@/shared/components/password-confirm-dialog";

import { CompanyInfoForm } from "./CompanyInfoForm";
import { CompanyInfoView } from "./CompanyInfoView";

import type { CompanyInfoViewModel } from "@/entities/account";

interface CompanyInfoCardProps {
  /** 등록된 회사정보. 아직 없으면 null. */
  company: CompanyInfoViewModel | null;
  /** 회사정보가 서버에 반영된 뒤 호출. 화면이 정보를 다시 읽음. */
  onSaved: () => void;
}

// 회사정보는 보기 → "수정"(미등록은 "등록") → 관리자 비밀번호 확인 → 입력 모드 → 취소·저장(Figma 10724:185906·185867). 들어갈 때마다 비밀번호를 다시 물음.
// 미등록은 회원가입에서 필수라 시안에 없어 디자인 QA(26/11/05 - PC - 33)대로 계좌정보처럼 빈 보기 → "등록"으로 시작함.
export function CompanyInfoCard({ company, onSaved }: CompanyInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  if (isEditing) {
    return (
      <CompanyInfoForm
        company={company}
        onSaved={onSaved}
        onFinishEdit={() => setIsEditing(false)}
      />
    );
  }

  return (
    <>
      <CompanyInfoView
        company={company}
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
