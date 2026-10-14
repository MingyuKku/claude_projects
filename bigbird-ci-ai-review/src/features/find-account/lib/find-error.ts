import { isApiError } from "@/shared/api";

import {
  AUTH_NUMBER_MAX_TRY,
  AUTH_NUMBER_MISMATCH_MESSAGE,
  SECONDS_PER_MINUTE,
  TIME_OUT_MESSAGE,
} from "../model/constants";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

export function formatBreakTime(seconds: number): string {
  if (seconds < SECONDS_PER_MINUTE) return `${seconds}초`;
  return `${Math.floor(seconds / SECONDS_PER_MINUTE)}분 ${seconds % SECONDS_PER_MINUTE}초`;
}

/** Extra fields the member backend sends next to `reason`; key names are the server contract. */
export interface FindErrorData {
  count?: number;
  "remaining count"?: number;
  "remaining time"?: number;
  // Unconfirmed whether the server spells it with a typo, so both are read.
  "remaing time"?: number;
}

export function mapFindError(reason: string, data?: FindErrorData): string {
  switch (reason) {
    case "authNum missmatch": {
      // The code input splits the text on \n, so remaining tries go on a second line.
      const remaining = data?.count ?? data?.["remaining count"];
      return remaining === undefined
        ? AUTH_NUMBER_MISMATCH_MESSAGE
        : `${AUTH_NUMBER_MISMATCH_MESSAGE}\n(남은 횟수 ${remaining}/${AUTH_NUMBER_MAX_TRY})`;
    }
    case "time out":
      return TIME_OUT_MESSAGE;
    case "request exists":
      return "인증시간(1분)이 종료 된 후 다시 시도 해주세요";
    case "break time": {
      const seconds = data?.["remaining time"] ?? data?.["remaing time"] ?? 0;
      return `${formatBreakTime(seconds)} 후에 다시 시도 해주세요`;
    }
    case "no result":
    default:
      return "이름과 이메일이 일치하는 계정을 찾을 수 없습니다.";
  }
}

// ─── Unified auth server error codes ─────────────────────────────────────────

interface AuthCodeEntry {
  message: string;
  /** Inline text under the form; otherwise a separate notice popup is needed. */
  isInline: boolean;
}

const NOT_FOUND_MESSAGE =
  "이름과 휴대전화번호가 일치하는 계정을 찾을 수 없습니다.";

const AUTH_CODE_MESSAGES: Record<string, AuthCodeEntry> = {
  // Name and phone do not match a Bigbird advertiser (serviceId=1) account.
  AUTH003: { message: NOT_FOUND_MESSAGE, isInline: true },
  AUTH004: { message: NOT_FOUND_MESSAGE, isInline: true },
  AUTH010: { message: "인증 정보를 찾을 수 없습니다.", isInline: false },
  AUTH011: { message: "인증 시간이 만료되었습니다.", isInline: false },
  AUTH012: {
    message: "인증코드가 만료되었거나 올바르지 않습니다.\n다시 시도해주세요.",
    isInline: true,
  },
  AUTH015: {
    message: "인증 요청 횟수를 초과했습니다.\n내일 다시 시도해주세요.",
    isInline: true,
  },
  AUTH017: { message: "아직 가입이 승인되지 않았습니다.", isInline: true },
  AUTH501: { message: "요청 파라미터가 유효하지 않습니다.", isInline: false },
  AUTH999: {
    message: "서버 내부 오류입니다.\n잠시 후 다시 시도해주세요.",
    isInline: false,
  },
};

const DEFAULT_AUTH_MESSAGE =
  "요청을 처리하는 중 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.";

function readRecord(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null) return undefined;
  return (value as Record<string, unknown>)[key];
}

/**
 * The auth server reports failure either as an HTTP 4xx (an `ApiError` whose `data`
 * is the body) or as a 200 with `success: false` (the body itself), so the code can
 * sit at `source.data.data.code`, `source.data.code` or `source.code`.
 */
export function extractAuthErrorCode(source: unknown): string {
  const data = readRecord(source, "data");
  const candidates = [
    readRecord(readRecord(data, "data"), "code"),
    readRecord(data, "code"),
    readRecord(source, "code"),
  ];
  const found = candidates.find((value) => typeof value === "string");
  return typeof found === "string" ? found : "";
}

export function mapAuthErrorCode(code: string): AuthCodeEntry {
  return (
    AUTH_CODE_MESSAGES[code] ?? {
      message: DEFAULT_AUTH_MESSAGE,
      isInline: false,
    }
  );
}

// ─── Member backend error body ───────────────────────────────────────────────

const FALLBACK_EMAIL_REASON = "no result";

function readErrorBody(error: unknown): Record<string, unknown> | undefined {
  if (!isApiError(error)) return undefined;
  if (typeof error.data !== "object" || error.data === null) return undefined;
  return error.data as Record<string, unknown>;
}

/** The member backend puts the failure reason in any of three fields. */
export function readEmailReason(error: unknown): string {
  const body = readErrorBody(error);
  const candidate = body?.message ?? body?.reason ?? body?.result;
  return typeof candidate === "string" ? candidate : FALLBACK_EMAIL_REASON;
}

export function readEmailData(error: unknown): FindErrorData | undefined {
  return readErrorBody(error) as FindErrorData | undefined;
}
