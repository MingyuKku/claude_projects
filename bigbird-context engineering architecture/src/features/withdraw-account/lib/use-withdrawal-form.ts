import { useState } from "react";

import { submitWithdrawal } from "./submit-withdrawal";

import type { ChangeEvent, FormEvent } from "react";

interface UseWithdrawalFormParams {
  onDone: () => void;
  onFailed: () => void;
}

/** 비밀번호 확인 단계의 입력·제출 상태. 요청 중에는 다시 제출하지 못하게 막음(v2는 연타하면 중복 요청). */
export function useWithdrawalForm({
  onDone,
  onFailed,
}: UseWithdrawalFormParams) {
  const [password, setPassword] = useState("");
  const [isWrong, setIsWrong] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChangePassword(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
    setIsWrong(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!password || isSubmitting) return;
    setIsSubmitting(true);
    const result = await submitWithdrawal(password);
    setIsSubmitting(false);

    if (result === "done") onDone();
    else if (result === "wrongPassword") setIsWrong(true);
    else onFailed();
  }

  return {
    password,
    isWrong,
    isSubmitting,
    canSubmit: password.length > 0,
    handleChangePassword,
    handleSubmit,
  };
}
