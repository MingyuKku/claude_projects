import {
  getPasswordError,
  isDeniedId,
  isValidEmailFormat,
  isValidIdFormat,
} from "@/entities/account";

import type {
  CreateSubAccountBody,
  UpdateSubAccountBody,
} from "../api/create-api";
import type { PasswordErrorCode } from "@/entities/account";

export interface CreateFormValues {
  name: string;
  identifier: string;
  password: string;
  passwordCheck: string;
  email: string;
}

export const EMPTY_CREATE_VALUES: CreateFormValues = {
  name: "",
  identifier: "",
  password: "",
  passwordCheck: "",
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
 * 모든 필수 칸(담당자명·아이디·비밀번호·비밀번호 확인·이메일)이 차 있고, 오류가 없고,
 * 아이디가 중복확인을 통과했을 때만 생성할 수 있음. 휴대폰 번호 칸은 2026-10-27 시안에서 빠짐.
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

/** 휴대폰 번호 칸은 2026-10-27 시안에서 빠졌고 서버도 받지 않음(2026-10-28). */
export function toCreateSubAccountBody(
  values: CreateFormValues,
): CreateSubAccountBody {
  return {
    id: values.identifier.trim(),
    pw: values.password,
    name: values.name.trim(),
    email: values.email.trim(),
  };
}

/** 수정 요청 본문. 처음 값과 달라진 필드만 담음(비밀번호는 입력했을 때만). */
export function toUpdateSubAccountBody(
  values: CreateFormValues,
  initial: CreateFormValues,
): UpdateSubAccountBody {
  const body: UpdateSubAccountBody = {};
  const name = values.name.trim();
  const identifier = values.identifier.trim();
  const email = values.email.trim();
  if (name !== initial.name) body.name = name;
  if (identifier !== initial.identifier) body.id = identifier;
  if (email !== initial.email) body.email = email;
  if (values.password !== "") body.pw = values.password;
  return body;
}

/** 수정 폼의 시작값. 비밀번호는 서버에서 읽을 수 없어 빈 칸이고, 바꿀 때만 입력함. */
export function toEditFormValues(account: {
  name: string;
  identifier: string;
  email: string;
}): CreateFormValues {
  return {
    name: account.name,
    identifier: account.identifier,
    password: "",
    passwordCheck: "",
    email: account.email,
  };
}

/**
 * 담당자명·아이디·이메일이 차 있고 오류가 없고, 비밀번호는 바꿀 때만(입력했다면 확인 칸과 같아야 함) 저장할 수 있음.
 * 아이디를 바꿨다면 중복확인을 통과해야 함. 값이 하나도 안 바뀌었으면 저장할 것이 없어 막음.
 */
export function canEditSubAccount(
  values: CreateFormValues,
  initial: CreateFormValues,
  errors: CreateFormErrors,
  idStatus: IdCheckStatus,
) {
  const hasError = Object.values(errors).some((error) => error !== null);
  const isRequiredFilled = [values.name, values.identifier, values.email].every(
    (value) => value.trim() !== "",
  );
  const isIdChanged = values.identifier.trim() !== initial.identifier;
  const isPasswordConfirmed =
    values.password === "" || values.password === values.passwordCheck;
  const isChanged =
    values.name.trim() !== initial.name ||
    isIdChanged ||
    values.email.trim() !== initial.email ||
    values.password !== "";
  return (
    isRequiredFilled &&
    !hasError &&
    isPasswordConfirmed &&
    (!isIdChanged || idStatus === "available") &&
    isChanged
  );
}
