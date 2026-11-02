export interface WithdrawFormValues {
  /** 선택한 은행 인덱스(문자열). 선택하지 않았으면 빈 문자열. */
  bankIdx: string;
  accountNumber: string;
  accountHolder: string;
}

export const EMPTY_WITHDRAW_FORM: WithdrawFormValues = {
  bankIdx: "",
  accountNumber: "",
  accountHolder: "",
};

/** 계좌번호는 숫자만 받음. */
export function sanitizeAccountNumber(value: string) {
  return value.replace(/\D/g, "");
}

/** "다음" 활성 조건: 은행·계좌번호·예금주 명(공백만은 빈 값)·통장 사본이 모두 있음. */
export function isWithdrawFormComplete(
  values: WithdrawFormValues,
  bankBook: File | null,
) {
  return (
    values.bankIdx !== "" &&
    values.accountNumber !== "" &&
    values.accountHolder.trim() !== "" &&
    bankBook !== null
  );
}

export interface WithdrawBody {
  bankIdx: number;
  accountNumber: string;
  accountHolder: string;
  /** 화면에 보여 준 금액(그때 보유 잔액). 서버가 현재 잔액과 다르면 `BALANCE_CHANGED`. */
  amount: number;
}

export function toWithdrawBody(
  values: WithdrawFormValues,
  amount: number,
): WithdrawBody {
  return {
    bankIdx: Number(values.bankIdx),
    accountNumber: values.accountNumber,
    accountHolder: values.accountHolder.trim(),
    amount,
  };
}
