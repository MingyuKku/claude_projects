import { mapLoginError, readLoginErrorData } from "./login-error";

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
      message: { code: "lockedTemporarily", values: { count: 5 } },
      isLocked: false,
      isExpired: false,
    });
  });

  it("401 + accountRejected 는 승인 대기 안내로 보낸다", () => {
    expect(mapLoginError(401, { reason: "accountRejected" })).toEqual({
      message: null,
      isLocked: true,
      isExpired: false,
    });
  });

  it("401 + accountExited 는 탈퇴 문구", () => {
    expect(mapLoginError(401, { reason: "accountExited" })).toEqual({
      message: { code: "exited" },
      isLocked: false,
      isExpired: false,
    });
  });

  it("401 + accountDestroyed 는 아이디와 만료 시각을 넣은 휴면 안내", () => {
    const result = mapLoginError(
      401,
      { reason: "accountDestroyed", time: "2026-07-01T14:30:00" },
      "tester",
    );
    expect(result.isLocked).toBe(false);
    expect(result.isExpired).toBe(false);
    expect(result.message).toEqual({
      code: "destroyed",
      values: {
        userId: "tester",
        year: 2026,
        month: 7,
        day: 1,
        hour: 14,
        minute: 30,
        at: new Date("2026-07-01T14:30:00"),
      },
    });
  });

  it("401 의 그 밖의 reason 은 불일치 문구", () => {
    expect(mapLoginError(401, { reason: "BAD" })).toEqual({
      message: { code: "mismatch" },
      isLocked: false,
      isExpired: false,
    });
  });

  it("403 + ACCOUNT_EXPIRED 는 휴면 화면으로 보낸다", () => {
    expect(mapLoginError(403, { reason: "ACCOUNT_EXPIRED" })).toEqual({
      message: null,
      isLocked: false,
      isExpired: true,
    });
  });

  it("403 의 그 밖의 reason 은 탈퇴 문구", () => {
    expect(mapLoginError(403)).toEqual({
      message: { code: "noAccount" },
      isLocked: false,
      isExpired: false,
    });
  });

  it("모르는 status 는 일반 오류 문구", () => {
    expect(mapLoginError(500)).toEqual({
      message: { code: "unknown" },
      isLocked: false,
      isExpired: false,
    });
  });

  // ACCOUNT_LOCKED 는 상태코드보다 먼저 본다. 서버가 401·403·400 어디에든 실어 보낸다.
  it.each([400, 401, 403])(
    "status %i 여도 ACCOUNT_LOCKED 면 잠금이다",
    (status) => {
      expect(mapLoginError(status, { reason: "ACCOUNT_LOCKED" })).toEqual({
        message: null,
        isLocked: true,
        isExpired: false,
      });
    },
  );
});

describe("readLoginErrorData", () => {
  it("time 형태가 어긋나도 reason은 유지한다", () =>
    expect(
      readLoginErrorData({ reason: "ACCOUNT_LOCKED", time: null }),
    ).toEqual({
      reason: "ACCOUNT_LOCKED",
      time: undefined,
    }));
  it("객체가 아닌 본문은 undefined를 돌려준다", () =>
    expect(readLoginErrorData("oops")).toBeUndefined());
});
