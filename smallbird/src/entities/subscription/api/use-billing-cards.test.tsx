import { renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { useBillingCards } from "./use-subscription-data";

import type { ReactNode } from "react";

vi.mock("@/shared/api", () => ({
  serverApiV3: { get: vi.fn() },
  payApi: {},
}));

const CARDS = [
  {
    id: "card-1",
    issuer: "하나카드",
    maskedNumber: "1234-56**-****-***7",
    isDefault: true,
  },
];

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  );
}

beforeEach(() => {
  vi.mocked(serverApiV3.get).mockReset().mockResolvedValue(CARDS);
});

describe("useBillingCards", () => {
  it("기본적으로 카드 목록을 조회한다", async () => {
    const { result } = renderHook(() => useBillingCards(), { wrapper });

    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(serverApiV3.get).toHaveBeenCalledWith(
      "/mypage/subscription/billing-cards",
    );
  });

  it("enabled가 false면 조회하지 않고 로딩도 아니다", async () => {
    const { result } = renderHook(() => useBillingCards({ enabled: false }), {
      wrapper,
    });

    // 요청이 나갔다면 이 사이에 호출됨.
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(serverApiV3.get).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});
