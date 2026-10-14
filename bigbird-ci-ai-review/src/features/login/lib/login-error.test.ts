import { mapLoginError } from "./login-error";

describe("mapLoginError", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("401 + accountLocked + time 이면 잠금 해제까지 남은 분을 안내한다", () => {
    vi.setSystemTime(new Date("2026-07-27T10:00:00"));
    expect(
      mapLoginError(401, {
        reason: "accountLocked",
        time: "2026-07-27T10:05:30",
      }),
    ).toEqual({
      message: "계정이 잠김 상태입니다. 5분 뒤에 다시 로그인을 시도해주세요.",
      locked: false,
      expired: false,
    });
  });

  it("401 + accountRejected 는 승인 대기 안내로 보낸다", () => {
    expect(mapLoginError(401, { reason: "accountRejected" })).toEqual({
      message: "",
      locked: true,
      expired: false,
    });
  });

  it("401 + accountExited 는 탈퇴 문구", () => {
    expect(mapLoginError(401, { reason: "accountExited" })).toEqual({
      message: "탈퇴한 회원입니다.",
      locked: false,
      expired: false,
    });
  });

  it("401 + accountDestroyed 는 아이디와 만료 시각을 넣은 휴면 안내", () => {
    const result = mapLoginError(
      401,
      { reason: "accountDestroyed", time: "2026-07-01T14:30:00" },
      "tester",
    );
    expect(result.locked).toBe(false);
    expect(result.expired).toBe(false);
    expect(result.message).toContain("[tester]");
    expect(result.message).toContain("2026년 7월 1일 14시 30분");
    expect(result.message).toContain("정보통신망");
  });

  it("401 의 그 밖의 reason 은 불일치 문구", () => {
    expect(mapLoginError(401, { reason: "BAD" })).toEqual({
      message: "아이디 또는 비밀번호가 일치하지 않습니다.",
      locked: false,
      expired: false,
    });
  });

  it("403 + ACCOUNT_EXPIRED 는 휴면 화면으로 보낸다", () => {
    expect(mapLoginError(403, { reason: "ACCOUNT_EXPIRED" })).toEqual({
      message: "",
      locked: false,
      expired: true,
    });
  });

  it("403 의 그 밖의 reason 은 탈퇴 문구", () => {
    expect(mapLoginError(403)).toEqual({
      message: "계정이 없거나 탈퇴한 회원입니다.",
      locked: false,
      expired: false,
    });
  });

  it("모르는 status 는 일반 오류 문구", () => {
    expect(mapLoginError(500)).toEqual({
      message: "오류가 발생했습니다. 잠시후 다시 시도해 주세요.",
      locked: false,
      expired: false,
    });
  });

  // ACCOUNT_LOCKED 는 상태코드보다 먼저 본다. 서버가 401·403·400 어디에든 실어 보낸다.
  it.each([400, 401, 403])(
    "status %i 여도 ACCOUNT_LOCKED 면 잠금이다",
    (status) => {
      expect(mapLoginError(status, { reason: "ACCOUNT_LOCKED" })).toEqual({
        message: "",
        locked: true,
        expired: false,
      });
    },
  );
});
