import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { registerThisDevice } from "./register-this-device";
import { useWebPush } from "./use-web-push";

import type { ReactNode } from "react";

vi.mock("./register-this-device", () => ({
  registerThisDevice: vi.fn(async () => true),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe("useWebPush", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("비로그인이면 기기를 등록하지 않는다", () => {
    renderHook(() => useWebPush(null), { wrapper });

    expect(registerThisDevice).not.toHaveBeenCalled();
  });

  it("Sub ID는 알림을 받지 않아 기기를 등록하지 않는다", () => {
    renderHook(() => useWebPush({ userIdx: 10, authority: "SUB" }), {
      wrapper,
    });

    expect(registerThisDevice).not.toHaveBeenCalled();
  });

  it("MASTER·ADMIN은 기기를 등록한다", async () => {
    renderHook(() => useWebPush({ userIdx: 11, authority: "MASTER" }), {
      wrapper,
    });

    await vi.waitFor(() => expect(registerThisDevice).toHaveBeenCalledOnce());
  });
});
