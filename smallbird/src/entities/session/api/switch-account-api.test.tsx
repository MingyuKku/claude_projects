import { act, renderHook } from "@testing-library/react";
import { SWRConfig } from "swr";

import { revokeFirebaseToken, serverApi, signOutFirebase } from "@/shared/api";

import { useSwitchAccount } from "./switch-account-api";

import type { ReactNode } from "react";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  serverApi: { get: vi.fn(), post: vi.fn() },
  revokeFirebaseToken: vi.fn(async () => {}),
  signOutFirebase: vi.fn(async () => {}),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
  );
}

describe("useSwitchAccount", () => {
  it("전환 전에 이 기기의 채팅방 잠금을 풀고 전환한다", async () => {
    const order: string[] = [];
    vi.mocked(revokeFirebaseToken).mockImplementation(async () => {
      order.push("revoke");
    });
    vi.mocked(serverApi.post).mockImplementation(async () => {
      order.push("change");
      return { result: true };
    });
    const { result } = renderHook(() => useSwitchAccount(), { wrapper });
    await act(() => result.current.trigger({ userIdx: 7 }));
    expect(order).toEqual(["revoke", "change"]);
    expect(serverApi.post).toHaveBeenCalledWith("/super/change", {
      userIdx: 7,
    });
    expect(signOutFirebase).toHaveBeenCalledOnce();
  });
});
