import { act, renderHook } from "@testing-library/react";

import { memberApi } from "@/shared/api";

import { useSubmitJoin } from "./use-submit-join";

import type { JoinPayload } from "../model/types";
import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  memberApi: { get: vi.fn(), post: vi.fn() },
}));

const post = vi.mocked(memberApi.post);

const payload: JoinPayload = {
  id: "tester01",
  pw: "Zq7!mkp2",
  certIdx: 7,
  email: "a@b.co",
  termsAgreed: true,
  personalInformationCollectionAgreed: true,
  companyName: "회사",
  contact: "01012345678",
  companyRegistrationNumber: "1234567890",
  mailorderBusinessNumber: null,
  classification: null,
  companyUrl: null,
};
const tokenData = { platform: "kakao", email: "k@b.co", uid: "u1" };

function setup(
  options: { withSns?: boolean; payload?: JoinPayload | null } = {},
) {
  const onJoined = vi.fn();
  const onLinkSocial = vi.fn().mockResolvedValue(undefined);
  const hook = renderHook(() =>
    useSubmitJoin({
      payload: options.payload === undefined ? payload : options.payload,
      tokenData: options.withSns ? tokenData : null,
      onLinkSocial: options.withSns ? onLinkSocial : undefined,
      onJoined,
    }),
  );
  return { ...hook, onJoined, onLinkSocial };
}

describe("useSubmitJoin", () => {
  beforeEach(() => {
    post.mockReset();
  });

  it("payload가 없으면 제출하지 않는다", async () => {
    const { result, onJoined } = setup({ payload: null });
    await act(() => result.current.submit());
    expect(post).not.toHaveBeenCalled();
    expect(onJoined).not.toHaveBeenCalled();
  });

  it("가입에 성공하면 onJoined를 부른다", async () => {
    post.mockResolvedValue({ result: "success", userIdx: 3 });
    const { result, onJoined, onLinkSocial } = setup();
    await act(() => result.current.submit());
    expect(onJoined).toHaveBeenCalledTimes(1);
    expect(onLinkSocial).not.toHaveBeenCalled();
    expect(result.current.isJoinFailed).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it("SNS로 들어왔으면 가입 뒤 계정을 연동한다", async () => {
    post.mockResolvedValue({ result: "success", userIdx: 3 });
    const { result, onJoined, onLinkSocial } = setup({ withSns: true });
    await act(() => result.current.submit());
    expect(onLinkSocial).toHaveBeenCalledWith("kakao", 3, "k@b.co", "u1");
    expect(onJoined).toHaveBeenCalledTimes(1);
  });

  it("SNS 연동이 실패해도 가입은 성공으로 본다", async () => {
    post.mockResolvedValue({ result: "success", userIdx: 3 });
    const { result, onJoined, onLinkSocial } = setup({ withSns: true });
    onLinkSocial.mockRejectedValue(new Error("link"));
    await act(() => result.current.submit());
    expect(onJoined).toHaveBeenCalledTimes(1);
    expect(result.current.isJoinFailed).toBe(false);
  });

  it.each([
    ["요청이 실패", () => post.mockRejectedValue(new Error("network"))],
    ["결과가 success가 아님", () => post.mockResolvedValue({ result: "fail" })],
    ["userIdx가 없음", () => post.mockResolvedValue({ result: "success" })],
  ])("%s하면 실패로 표시하고 넘어가지 않는다", async (_name, arrange) => {
    arrange();
    const { result, onJoined } = setup();
    await act(() => result.current.submit());
    expect(result.current.isJoinFailed).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
    expect(onJoined).not.toHaveBeenCalled();
  });
});
