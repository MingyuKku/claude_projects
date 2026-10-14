import {
  MISMATCH_MESSAGE,
  MS_PER_MINUTE,
  UNKNOWN_MESSAGE,
} from "../model/constants";

import type { LoginErrorData, LoginErrorResult } from "../model/types";

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;

// The server sends camelCase reasons with 401 and SCREAMING_CASE with 403.
const REASON_LOCKED = "ACCOUNT_LOCKED";
const REASON_LOCKED_TEMPORARILY = "accountLocked";
const REASON_REJECTED = "accountRejected";
const REASON_EXITED = "accountExited";
const REASON_DESTROYED = "accountDestroyed";
const REASON_EXPIRED = "ACCOUNT_EXPIRED";

function plain(message: string): LoginErrorResult {
  return { message, locked: false, expired: false };
}

const LOCKED_RESULT: LoginErrorResult = {
  message: "",
  locked: true,
  expired: false,
};

/** Remaining lock time in minutes; 0 once it has passed. */
function minutesUntil(time: string): number {
  return Math.max(
    0,
    Math.floor((new Date(time).getTime() - Date.now()) / MS_PER_MINUTE),
  );
}

// Legal notice required by the Korean Network Act article 29 (dormant accounts):
// the wording must not be shortened.
function destroyedMessage(time: string, userId: string): string {
  const destroyedAt = new Date(time);
  return (
    "안녕하세요. 빅버드(BIGBIRD)입니다.\n" +
    `빅버드 계정명 [${userId}]은 정보통신망 이용촉진 및 정보보호 등에 관한 법률 제29조에 의거하여 ` +
    `1년 이상 접속하지 않아 ${destroyedAt.getFullYear()}년 ${destroyedAt.getMonth() + 1}월 ` +
    `${destroyedAt.getDate()}일 ${destroyedAt.getHours()}시 ${destroyedAt.getMinutes()}분에 계정이 만료되었습니다. ` +
    "다음에 더 좋은 서비스로 만나뵙겠습니다."
  );
}

export function mapLoginError(
  status: number,
  data?: LoginErrorData,
  userId?: string,
): LoginErrorResult {
  const reason = data?.reason;

  // Checked before the status: the server sends this reason with several status codes.
  if (reason === REASON_LOCKED) return LOCKED_RESULT;

  if (status === HTTP_UNAUTHORIZED) {
    if (reason === REASON_LOCKED_TEMPORARILY && data?.time) {
      return plain(
        `계정이 잠김 상태입니다. ${minutesUntil(data.time)}분 뒤에 다시 로그인을 시도해주세요.`,
      );
    }
    if (reason === REASON_REJECTED) return LOCKED_RESULT;
    if (reason === REASON_EXITED) return plain("탈퇴한 회원입니다.");
    if (reason === REASON_DESTROYED && data?.time) {
      return plain(destroyedMessage(data.time, userId ?? ""));
    }
    return plain(MISMATCH_MESSAGE);
  }

  if (status === HTTP_FORBIDDEN) {
    if (reason === REASON_EXPIRED) {
      return { message: "", locked: false, expired: true };
    }
    return plain("계정이 없거나 탈퇴한 회원입니다.");
  }

  return plain(UNKNOWN_MESSAGE);
}
