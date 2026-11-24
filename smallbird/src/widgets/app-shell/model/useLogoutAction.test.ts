import { renderHook } from "@testing-library/react";
import { toast } from "sonner";

import { useLogout } from "@/entities/session";
import { registerThisDevice } from "@/features/enable-web-push";
import { ROUTES } from "@/shared/config";
import { hardNavigate } from "@/shared/lib";

import { useLogoutAction } from "./useLogoutAction";

vi.mock("@/entities/session", () => ({ useLogout: vi.fn() }));
vi.mock("@/features/enable-web-push", () => ({
  registerThisDevice: vi.fn(async () => true),
}));
vi.mock("@/shared/lib", () => ({ hardNavigate: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

function mockLogout(trigger: () => Promise<void>) {
  vi.mocked(useLogout).mockReturnValue({
    trigger,
    isMutating: false,
  } as unknown as ReturnType<typeof useLogout>);
}

describe("useLogoutAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("로그아웃에 성공하면 홈을 새로 불러온다", async () => {
    mockLogout(async () => {});
    const { result } = renderHook(() => useLogoutAction());

    await result.current.handleClickLogout();

    expect(hardNavigate).toHaveBeenCalledExactlyOnceWith(ROUTES.main);
    expect(registerThisDevice).not.toHaveBeenCalled();
  });

  it("로그아웃 요청이 실패하면 꺼 둔 웹푸시를 다시 켜고 실패를 알린다", async () => {
    mockLogout(async () => {
      throw new Error("500");
    });
    const { result } = renderHook(() => useLogoutAction());

    await result.current.handleClickLogout();

    expect(registerThisDevice).toHaveBeenCalledOnce();
    expect(toast.error).toHaveBeenCalledOnce();
    expect(hardNavigate).not.toHaveBeenCalled();
  });
});
