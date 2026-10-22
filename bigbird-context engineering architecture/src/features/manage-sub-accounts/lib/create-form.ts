import {
  getPasswordError,
  isDeniedId,
  isValidEmailFormat,
  isValidIdFormat,
} from "@/entities/account";

import type { CreateSubAccountBody } from "../api/create-api";
import type { PasswordErrorCode } from "@/entities/account";

export interface CreateFormValues {
  name: string;
  identifier: string;
  password: string;
  passwordCheck: string;
  phone: string;
  email: string;
}

export const EMPTY_CREATE_VALUES: CreateFormValues = {
  name: "",
  identifier: "",
  password: "",
  passwordCheck: "",
  phone: "",
  email: "",
};

/** 아이디 중복확인 진행 상태. 아이디를 고치면 다시 idle이 됨(v2는 고쳐도 통과한 것으로 남던 버그). */
export type IdCheckStatus = "idle" | "available" | "taken" | "error";

export interface CreateFormErrors {
  /** 아이디 형식 오류. 중복확인 결과(taken·error)와 별개. */
  identifier: "format" | null;
  password: PasswordErrorCode | null;
  passwordCheck: "mismatch" | null;
  email: "format" | null;
}

export function validateCreateForm(values: CreateFormValues): CreateFormErrors {
  return {
    // 비어 있으면 아직 입력 전이라 오류로 보지 않음(생성 버튼이 막아 줌).
    identifier:
      values.identifier && !isValidIdFormat(values.identifier)
        ? "format"
        : null,
    password: values.password
      ? getPasswordError(values.password, values.identifier)
      : null,
    passwordCheck:
      values.passwordCheck && values.passwordCheck !== values.password
        ? "mismatch"
        : null,
    email: values.email && !isValidEmailFormat(values.email) ? "format" : null,
  };
}

/** 사용 가능 여부를 서버에 묻기 전에 걸러지는 아이디(형식 위반·금지어)인지. 금지어는 중복과 같은 문구로 알림. */
export function isUncheckableId(identifier: string) {
  return !isValidIdFormat(identifier) || isDeniedId(identifier);
}

/**
 * 모든 필수 칸(담당자명·아이디·비밀번호·비밀번호 확인·휴대폰 번호·이메일)이 차 있고, 오류가 없고,
 * 아이디가 중복확인을 통과했을 때만 생성할 수 있음. 휴대폰 인증은 없음(시안·v2).
 */
export function canCreateSubAccount(
  values: CreateFormValues,
  errors: CreateFormErrors,
  idStatus: IdCheckStatus,
) {
  const isFilled = Object.values(values).every((value) => value.trim() !== "");
  const hasError = Object.values(errors).some((error) => error !== null);
  return isFilled && !hasError && idStatus === "available";
}

/** 휴대폰 번호는 본인 정보와 같은 형태(숫자만)로 보냄. */
export function toCreateSubAccountBody(
  values: CreateFormValues,
): CreateSubAccountBody {
  return {
    id: values.identifier.trim(),
    pw: values.password,
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.replace(/\D/g, ""),
  };
}
