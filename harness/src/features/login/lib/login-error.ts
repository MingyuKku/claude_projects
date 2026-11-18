import { MS_PER_MINUTE } from "../model/constants";
import { loginErrorDataSchema } from "../model/schema";

import type { LoginErrorData } from "../model/schema";
import type { LoginErrorResult, LoginMessage } from "../model/types";

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;

// 서버는 401에는 camelCase, 403에는 SCREAMING_CASE 사유를 보냄.
const REASON_LOCKED = "ACCOUNT_LOCKED";
const REASON_LOCKED_TEMPORARILY = "accountLocked";
const REASON_REJECTED = "accountRejected";
const REASON_EXITED = "accountExited";
const REASON_DESTROYED = "accountDestroyed";
const REASON_EXPIRED = "ACCOUNT_EXPIRED";

function plain(message: LoginMessage): LoginErrorResult {
  return { message, isLocked: false, isExpired: false };
}

const LOCKED_RESULT: LoginErrorResult = {
  message: null,
  isLocked: true,
  isExpired: false,
};

/** 남은 잠금 시간(분). 이미 지났으면 0. */
function minutesUntil(time: string): number {
  return Math.max(
    0,
    Math.floor((new Date(time).getTime() - Date.now()) / MS_PER_MINUTE),
  );
}

// 정보통신망법 제29조(휴면 계정)가 요구하는 법정 고지문이라 문구를 줄이면 안 됨.
// 날짜 부분은 따로 넘겨 문장이 번역 키 하나로 유지되게 함.
function destroyedMessage(time: string, userId: string): LoginMessage {
  const destroyedAt = new Date(time);
  return {
    code: "destroyed",
    values: {
      userId,
      year: destroyedAt.getFullYear(),
      month: destroyedAt.getMonth() + 1,
      day: destroyedAt.getDate(),
      hour: destroyedAt.getHours(),
      minute: destroyedAt.getMinutes(),
      // ko 문구는 위 숫자 값으로 원문 그대로 만들고, 다른 언어는 현재 언어의 날짜·시각 형식을 씀.
      at: destroyedAt,
    },
  };
}

export function mapLoginError(
  status: number,
  data?: LoginErrorData,
  userId?: string,
): LoginErrorResult {
  const reason = data?.reason;

  // 서버가 이 사유를 여러 상태 코드로 보내므로 상태보다 먼저 확인함.
  if (reason === REASON_LOCKED) return LOCKED_RESULT;

  if (status === HTTP_UNAUTHORIZED) {
    if (reason === REASON_LOCKED_TEMPORARILY && data?.time) {
      return plain({
        code: "lockedTemporarily",
        values: { count: minutesUntil(data.time) },
      });
    }
    if (reason === REASON_REJECTED) return LOCKED_RESULT;
    if (reason === REASON_EXITED) return plain({ code: "exited" });
    if (reason === REASON_DESTROYED && data?.time) {
      return plain(destroyedMessage(data.time, userId ?? ""));
    }
    return plain({ code: "mismatch" });
  }

  if (status === HTTP_FORBIDDEN) {
    if (reason === REASON_EXPIRED) {
      return { message: null, isLocked: false, isExpired: true };
    }
    return plain({ code: "noAccount" });
  }

  return plain({ code: "unknown" });
}

/** 에러 본문은 타입이 없으므로 로그인 에러 형태가 아니면 undefined를 돌려줌. */
export function readLoginErrorData(data: unknown): LoginErrorData | undefined {
  const parsed = loginErrorDataSchema.safeParse(data);
  return parsed.success ? parsed.data : undefined;
}
