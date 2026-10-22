import { act, renderHook } from "@testing-library/react";

import { memberApi } from "@/shared/api";

import { useEmailDuplicateCheck } from "./use-email-duplicate-check";

import type { CheckStatus } from "@/entities/account";
import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  memberApi: { get: vi.fn(), post: vi.fn() },
}));

const post = vi.mocked(memberApi.post);

function setup(email = "", emailStatus: CheckStatus = "idle") {
  const patchAccount = vi.fn();
  const hook = renderHook(() =>
    useEmailDuplicateCheck({ email, emailStatus, patchAccount }),
  );
  return { ...hook, patchAccount };
}

describe("useEmailDuplicateCheck", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    post.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("올바른 형식의 이메일은 입력이 멈춘 뒤 중복확인을 보낸다", async () => {
    post.mockResolvedValue({ result: 0 });
    const { result, patchAccount } = setup();

    act(() => result.current.changeEmail("a@b.co"));
    expect(patchAccount).toHaveBeenCalledWith({
      email: "a@b.co",
      emailStatus: "idle",
    });
    expect(post).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(post).toHaveBeenCalledTimes(1);
    expect(patchAccount).toHaveBeenLastCalledWith({ emailStatus: "possible" });
  });

  it("이미 있는 이메일이면 wrong 상태로 바꾼다", async () => {
    post.mockResolvedValue({ result: 1 });
    const { result, patchAccount } = setup();

    act(() => result.current.changeEmail("a@b.co"));
    await act(() => vi.advanceTimersByTimeAsync(300));

    expect(patchAccount).toHaveBeenLastCalledWith({ emailStatus: "wrong" });
  });

  it("형식이 틀린 이메일은 중복확인을 보내지 않는다", async () => {
    const { result } = setup();

    act(() => result.current.changeEmail("abc"));
    await act(() => vi.advanceTimersByTimeAsync(300));

    expect(post).not.toHaveBeenCalled();
  });

  it("포커스가 빠질 때 빈 값과 잘못된 형식을 알린다", () => {
    const empty = setup("");
    act(() => empty.result.current.blurEmail());
    expect(empty.result.current.emailError).toBe("empty");

    const invalid = setup("abc");
    act(() => invalid.result.current.blurEmail());
    expect(invalid.result.current.emailError).toBe("emailFormatError");
  });

  it("포커스가 빠질 때 이미 결과가 있으면 다시 묻지 않고, 없으면 확인한다", async () => {
    post.mockResolvedValue({ result: 0 });

    const checked = setup("a@b.co", "possible");
    act(() => checked.result.current.blurEmail());
    expect(post).not.toHaveBeenCalled();

    const unchecked = setup("a@b.co", "idle");
    await act(async () => unchecked.result.current.blurEmail());
    expect(post).toHaveBeenCalledTimes(1);
    expect(unchecked.patchAccount).toHaveBeenCalledWith({
      emailStatus: "possible",
    });
  });

  it("확인 요청이 실패하면 오류 코드를 남긴다", async () => {
    post.mockRejectedValue(new Error("network"));
    const { result } = setup("a@b.co", "idle");

    await act(async () => result.current.blurEmail());

    expect(result.current.emailError).toBe("emailCheckError");
  });
});
