import { renderHook } from "@testing-library/react";

const registerThisDevice = vi.hoisted(() => vi.fn(async () => true));
vi.mock("./register-this-device", () => ({ registerThisDevice }));

// 같은 사용자를 한 번만 등록하는 값이 모듈에 있어, 테스트마다 새로 불러와 비움.
async function loadHook() {
  vi.resetModules();
  return (await import("./use-push-registration")).usePushRegistration;
}

describe("usePushRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerThisDevice.mockResolvedValue(true);
  });

  it("로그인한 사용자가 없으면 등록하지 않는다", async () => {
    const usePushRegistration = await loadHook();
    renderHook(() => usePushRegistration(undefined));

    expect(registerThisDevice).not.toHaveBeenCalled();
  });

  it("셸이 다시 만들어져도 같은 사용자는 한 번만 등록한다", async () => {
    const usePushRegistration = await loadHook();
    const first = renderHook(() => usePushRegistration(1));
    await vi.waitFor(() => expect(registerThisDevice).toHaveBeenCalledTimes(1));
    first.unmount();
    renderHook(() => usePushRegistration(1));

    expect(registerThisDevice).toHaveBeenCalledTimes(1);
  });

  it("계정이 바뀌면 새 계정으로 다시 등록한다", async () => {
    const usePushRegistration = await loadHook();
    const { rerender } = renderHook(
      ({ userIdx }) => usePushRegistration(userIdx),
      { initialProps: { userIdx: 1 as number | undefined } },
    );
    await vi.waitFor(() => expect(registerThisDevice).toHaveBeenCalledTimes(1));
    rerender({ userIdx: 2 });

    await vi.waitFor(() => expect(registerThisDevice).toHaveBeenCalledTimes(2));
  });

  it("등록하지 못했으면 다음에 셸이 만들어질 때 다시 시도한다", async () => {
    registerThisDevice.mockResolvedValue(false);
    const usePushRegistration = await loadHook();
    const first = renderHook(() => usePushRegistration(1));
    await vi.waitFor(() => expect(registerThisDevice).toHaveBeenCalledTimes(1));
    first.unmount();
    renderHook(() => usePushRegistration(1));

    await vi.waitFor(() => expect(registerThisDevice).toHaveBeenCalledTimes(2));
  });
});
