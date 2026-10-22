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

// 문구는 두지 않음. 판정 결과(boolean·코드)만 돌려주고, 화면이 자기 번역 키로 문구를 만듦.
export const idFormatSchema = z.string().regex(ID_PATTERN);
export const emailFormatSchema = z.string().regex(EMAIL_PATTERN);
export const passwordFormatSchema = z.string().regex(PASSWORD_PATTERN);

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

/** 비밀번호 규칙 위반 종류. 화면이 자기 번역 키(`…Error.{code}`)로 문구를 만듦. */
export type PasswordErrorCode = "format" | "containsId" | "repeated";

/** Returns null when valid, otherwise which rule failed. */
export function getPasswordError(
  password: string,
  id: string,
): PasswordErrorCode | null {
  const format = passwordFormatSchema.safeParse(password);
  if (!format.success) return "format";
  if (id && password.includes(id)) return "containsId";
  if (REPEAT_PATTERN.test(password) || isContinuedValue(password)) {
    return "repeated";
  }
  return null;
}

/** `/valid/pw` 가 거절한 이유. 모르는 reason 은 `fallback`. */
export type ValidPasswordErrorCode =
  "containsId" | "containsPersonalInfo" | "fallback";

export function mapValidPasswordError(reason?: string): ValidPasswordErrorCode {
  if (reason === "contains id") return "containsId";
  if (reason === "contains personal info") return "containsPersonalInfo";
  return "fallback";
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
