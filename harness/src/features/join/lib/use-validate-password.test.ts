import { act, renderHook } from "@testing-library/react";

import { memberApi } from "@/shared/api";

import { useValidatePassword } from "./use-validate-password";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  memberApi: { get: vi.fn(), post: vi.fn() },
}));

const post = vi.mocked(memberApi.post);

function setup(certIdx: number | null = 7) {
  const onValid = vi.fn();
  const hook = renderHook(() =>
    useValidatePassword({
      id: "tester01",
      password: "Zq7!mkp2",
      certIdx,
      onValid,
    }),
  );
  return { ...hook, onValid };
}

describe("useValidatePassword", () => {
  beforeEach(() => {
    post.mockReset();
  });

  it("본인인증 전이면 서버에 묻지 않는다", async () => {
    const { result, onValid } = setup(null);
    await act(() => result.current.validate());
    expect(post).not.toHaveBeenCalled();
    expect(onValid).not.toHaveBeenCalled();
  });

  it("검증을 통과하면 onValid를 부른다", async () => {
    post.mockResolvedValue({ result: true });
    const { result, onValid } = setup();
    await act(() => result.current.validate());
    expect(post).toHaveBeenCalledWith("/valid/pw", {
      id: "tester01",
      password: "Zq7!mkp2",
      certIdx: 7,
    });
    expect(onValid).toHaveBeenCalledTimes(1);
    expect(result.current.serverError).toBeNull();
    expect(result.current.isValidating).toBe(false);
  });

  it("검증에 실패하면 서버 사유를 오류로 남기고 넘어가지 않는다", async () => {
    post.mockResolvedValue({ result: false, reason: "idInPassword" });
    const { result, onValid } = setup();
    await act(() => result.current.validate());
    expect(onValid).not.toHaveBeenCalled();
    expect(result.current.serverError).not.toBeNull();
  });
});
