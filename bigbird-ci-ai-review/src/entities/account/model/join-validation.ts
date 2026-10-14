import { z } from "zod";

/**
 * Sign-up input validation. The server validates too; this runs first so users
 * do not learn about a failure only after submitting. The server verdict is final.
 */

export const ID_PATTERN = /^[A-Za-z0-9_.]{6,20}$/;
export const ID_DENYLIST = ["admin", "concepters", "samsung"];
export const EMAIL_PATTERN =
  /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;
/** 8-20 chars with at least one digit, letter and special character. */
export const PASSWORD_PATTERN =
  /^.*(?=^.{8,20}$)(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%&^/*\-+=?_{}()[\]]).*$/;

/** Same character four times in a row. */
const REPEAT_PATTERN = /(\w)\1\1\1/i;

export const ID_HINT =
  "영문, 숫자, 밑줄, 점을 이용하여 6-20자로 입력해 주세요.";
export const PASSWORD_HINT =
  "영문, 숫자, 특수문자를 조합 8-20자로 입력해주세요.";
export const PASSWORD_MISMATCH_MESSAGE =
  "일치하지 않습니다. 다시 입력해 주세요.";
export const PASSWORD_MATCH_MESSAGE = "비밀번호가 일치합니다.";
export const FIELD_EMPTY_MESSAGE = "입력된 내용이 없어요.";
export const EMAIL_FORMAT_ERROR_MESSAGE = "올바른 이메일 형식이 아닙니다.";
export const EMAIL_DUPLICATE_MESSAGE =
  "입력하신 이메일을 사용 중인 계정이 존재합니다.";

const PASSWORD_CONTAINS_ID_MESSAGE = "아이디를 포함한 비밀번호 불가";
const PASSWORD_REPEATED_MESSAGE = "동일∙연속적 숫자,문자 반복 불가";

export const idFormatSchema = z.string().regex(ID_PATTERN, ID_HINT);
export const emailFormatSchema = z
  .string()
  .regex(EMAIL_PATTERN, EMAIL_FORMAT_ERROR_MESSAGE);
export const passwordFormatSchema = z
  .string()
  .regex(PASSWORD_PATTERN, PASSWORD_HINT);

export function isValidIdFormat(id: string): boolean {
  return idFormatSchema.safeParse(id).success;
}

export function isDeniedId(id: string): boolean {
  return ID_DENYLIST.some((denied) => id.toLowerCase().includes(denied));
}

export function isValidEmailFormat(email: string): boolean {
  return emailFormatSchema.safeParse(email).success;
}

/** Detects four consecutive characters, ascending or descending. */
export function isContinuedValue(value: string): boolean {
  for (let index = 0; index + 3 < value.length; index++) {
    const [first = 0, second = 0, third = 0, fourth = 0] = [0, 1, 2, 3].map(
      (offset) => value.charCodeAt(index + offset),
    );
    const ascending =
      second - first === 1 && third - second === 1 && fourth - third === 1;
    const descending =
      first - second === 1 && second - third === 1 && third - fourth === 1;
    if (ascending || descending) return true;
  }
  return false;
}

/** Returns null when valid, otherwise the message to show. */
export function validatePassword(password: string, id: string): string | null {
  const format = passwordFormatSchema.safeParse(password);
  if (!format.success) return PASSWORD_HINT;
  if (id && password.includes(id)) return PASSWORD_CONTAINS_ID_MESSAGE;
  if (REPEAT_PATTERN.test(password) || isContinuedValue(password)) {
    return PASSWORD_REPEATED_MESSAGE;
  }
  return null;
}

export function mapValidPasswordError(reason?: string): string {
  if (reason === "contains id") return PASSWORD_CONTAINS_ID_MESSAGE;
  if (reason === "contains personal info")
    return "개인정보 포함한 비밀번호 불가";
  return "비밀번호를 변경할 수 없습니다 조건을 다시 한번더 확인해주세요";
}

// --- Business information ---------------------------------------------------

const COMPANY_URL_PATTERN =
  /^((http(s?)):\/\/)?((\w+)[.])+(asia|biz|cc|cn|com|de|eu|in|info|jobs|jp|kr|mobi|mx|name|net|nz|org|travel|tv|tw|uk|us)(\/(\w*))*$/i;
const COMPANY_URL_MAX_LENGTH = 50;

/** Optional field: empty passes, otherwise only the domain shape is checked. */
export const companyUrlSchema = z
  .string()
  .refine((url) => !url || COMPANY_URL_PATTERN.test(url));

export function isValidCompanyUrl(url: string): boolean {
  return companyUrlSchema.safeParse(url).success;
}

export function normalizeCompanyUrl(url: string): string {
  const trimmed = url.slice(0, COMPANY_URL_MAX_LENGTH);
  if (!trimmed || trimmed.includes("http")) return trimmed;
  return `http://${trimmed}`;
}

/** Keeps digits only and truncates; for business number and phone inputs. */
export function digitsOnly(value: string, maxLength: number): string {
  return value.replace(/[^0-9]/g, "").slice(0, maxLength);
}

const HANGUL_PATTERN = /^[가-힣]+$/;
const MAILORDER_YEAR_LENGTH = 4;
const MAILORDER_SERIAL_MAX_LENGTH = 5;
const MAILORDER_SERIAL_MIN_LENGTH = 2;
const MAILORDER_REGION_MAX_LENGTH = 4;

/**
 * Joins the three mail-order business report inputs (year-region-serial) into one
 * string. Reports with an empty region really exist, so both shapes are built.
 */
export function buildMailorderNumber(
  parts: [string, string, string],
): string | null {
  const year = parts[0].slice(0, MAILORDER_YEAR_LENGTH);
  const serial = parts[2].slice(0, MAILORDER_SERIAL_MAX_LENGTH);
  const region = HANGUL_PATTERN.test(parts[1]) ? parts[1] : "";

  if (
    year.length !== MAILORDER_YEAR_LENGTH ||
    serial.length < MAILORDER_SERIAL_MIN_LENGTH ||
    serial.length > MAILORDER_SERIAL_MAX_LENGTH
  ) {
    return null;
  }
  if (region.length === 0) return `${year}-${serial}`;
  if (region.length <= MAILORDER_REGION_MAX_LENGTH) {
    return `${year}-${region}-${serial}`;
  }
  return null;
}

export const UPLOAD_EXTENSIONS = ["jpg", "gif", "png", "bmp", "jpeg", "pdf"];

export function isAllowedUploadExtension(filename: string): boolean {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  return UPLOAD_EXTENSIONS.includes(extension);
}

/** Duplicate-check state for id and email. */
export type CheckStatus = "idle" | "valid" | "wrong" | "possible" | "needCheck";

export function checkStatusMessage(status: CheckStatus, label: string): string {
  if (status === "wrong") return `이미 사용중인 ${label}입니다`;
  if (status === "possible") return `사용 가능한 ${label}입니다`;
  if (status === "needCheck") return `${label} 중복확인이 필요합니다`;
  return "";
}

export interface FileSizeInfo {
  label: string;
  tooLarge: boolean;
}

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * 1024;
const MAX_UPLOAD_MB = 5;

/** Upload size label plus the over-5MB verdict. */
export function classifyFileSize(bytes: number): FileSizeInfo {
  if (bytes < BYTES_PER_KB) return { label: `${bytes}Bytes`, tooLarge: false };
  if (bytes < BYTES_PER_MB) {
    return { label: `${Math.round(bytes / BYTES_PER_KB)}KB`, tooLarge: false };
  }
  const megabytes = Math.round(bytes / BYTES_PER_MB);
  return { label: `${megabytes}MB`, tooLarge: megabytes > MAX_UPLOAD_MB };
}
