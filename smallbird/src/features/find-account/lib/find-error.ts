import { z } from "zod";

import { isApiError } from "@/shared/api";

import {
  AUTH_NUMBER_MAX_TRY,
  EMAIL_REASON,
  SECONDS_PER_MINUTE,
} from "../model/constants";

import type { FindMessage } from "../model/types";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

/** 대기 시간 안내: 1분 미만은 초만, 그 이상은 분과 초를 보여 줌. */
export function breakTimeMessage(seconds: number): FindMessage {
  if (seconds < SECONDS_PER_MINUTE) {
    return { code: "breakTimeSeconds", values: { seconds } };
  }
  return {
    code: "breakTimeMinutes",
    values: {
      minutes: Math.floor(seconds / SECONDS_PER_MINUTE),
      seconds: seconds % SECONDS_PER_MINUTE,
    },
  };
}

/** 회원 백엔드가 `reason`과 함께 보내는 부가 필드. 키 이름은 서버 계약. */
// 확정되지 않은 서버 계약이라, 필드 하나가 어긋나도 나머지 필드는 살리도록 필드별로 버림.
const findErrorDataSchema = z.object({
  count: z.number().optional().catch(undefined),
  "remaining count": z.number().optional().catch(undefined),
  "remaining time": z.number().optional().catch(undefined),
  // 서버가 오타 철자로 보내는지 확인되지 않아 두 철자를 모두 읽음.
  "remaing time": z.number().optional().catch(undefined),
});
export type FindErrorData = z.infer<typeof findErrorDataSchema>;

export function mapFindError(
  reason: string,
  data?: FindErrorData,
): FindMessage {
  switch (reason) {
    case EMAIL_REASON.authNumMismatch: {
      // 인증번호 입력란이 \n 기준으로 문구를 나누므로 남은 횟수는 둘째 줄에 둠.
      const remaining = data?.count ?? data?.["remaining count"];
      return remaining === undefined
        ? { code: "authMismatch" }
        : {
            code: "authMismatchRemaining",
            values: { remaining, max: AUTH_NUMBER_MAX_TRY },
          };
    }
    case EMAIL_REASON.timeOut:
      return { code: "timeOut" };
    case EMAIL_REASON.requestExists:
      return { code: "resendWait" };
    case EMAIL_REASON.breakTime: {
      const seconds = data?.["remaining time"] ?? data?.["remaing time"] ?? 0;
      return breakTimeMessage(seconds);
    }
    case EMAIL_REASON.noResult:
    default:
      return { code: "notFoundEmail" };
  }
}

// ─── 통합 인증 서버 에러 코드 ─────────────────────────────────────────

interface AuthCodeEntry {
  message: FindMessage;
  /** 폼 아래 인라인 문구로 보이면 true, 아니면 별도 안내 팝업이 필요함. */
  isInline: boolean;
}

const NOT_FOUND_MESSAGE: FindMessage = { code: "notFoundPhone" };

const AUTH_CODE_MESSAGES: Record<string, AuthCodeEntry> = {
  // 이름과 휴대폰 번호가 빅버드 광고주(serviceId=1) 계정과 일치하지 않는 경우.
  AUTH003: { message: NOT_FOUND_MESSAGE, isInline: true },
  AUTH004: { message: NOT_FOUND_MESSAGE, isInline: true },
  AUTH010: { message: { code: "authInfoNotFound" }, isInline: false },
  AUTH011: { message: { code: "authExpired" }, isInline: false },
  AUTH012: { message: { code: "authCodeInvalid" }, isInline: true },
  AUTH015: { message: { code: "authLimit" }, isInline: true },
  AUTH017: { message: { code: "notApproved" }, isInline: true },
  AUTH501: { message: { code: "invalidParams" }, isInline: false },
  AUTH999: { message: { code: "serverError" }, isInline: false },
};

const DEFAULT_AUTH_MESSAGE: FindMessage = { code: "unknown" };

// ApiError 인스턴스도 받으므로 plain object만 통과시키는 Zod 대신 객체 여부만 확인해 읽는다.
function readRecord(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null) return undefined;
  return Reflect.get(value, key);
}

const errorRecordSchema = z.record(z.string(), z.unknown());

/**
 * 인증 서버는 실패를 HTTP 4xx(본문이 `data`에 담긴 `ApiError`)나 200 + `success: false`
 * (본문 자체)로 알려 주므로, 코드는 `source.data.data.code`, `source.data.code`,
 * `source.code` 중 한 곳에 있음.
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

// ─── 회원 백엔드 에러 본문 ───────────────────────────────────────────────

const FALLBACK_EMAIL_REASON = EMAIL_REASON.noResult;

function readErrorBody(error: unknown): Record<string, unknown> | undefined {
  if (!isApiError(error)) return undefined;
  const parsed = errorRecordSchema.safeParse(error.data);
  return parsed.success ? parsed.data : undefined;
}

/** 회원 백엔드는 실패 사유를 세 필드 중 하나에 담아 보냄. */
export function readEmailReason(error: unknown): string {
  const body = readErrorBody(error);
  const candidate = body?.message ?? body?.reason ?? body?.result;
  return typeof candidate === "string" ? candidate : FALLBACK_EMAIL_REASON;
}

export function readEmailData(error: unknown): FindErrorData | undefined {
  const parsed = findErrorDataSchema.safeParse(readErrorBody(error));
  return parsed.success ? parsed.data : undefined;
}
