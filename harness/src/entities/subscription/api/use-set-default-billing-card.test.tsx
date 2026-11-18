import { act, renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { useSetDefaultBillingCard } from "./use-set-default-billing-card";
import { useBillingCards } from "./use-subscription-data";

import type { ReactNode } from "react";

vi.mock("@/shared/api", () => ({
  serverApiV3: { get: vi.fn(), put: vi.fn() },
  payApi: {},
}));

const CARDS = [
  {
    id: "card-1",
    issuer: "하나카드",
    maskedNumber: "1234-56**-****-***7",
    isDefault: true,
  },
  {
    id: "card-2",
    issuer: "현대카드",
    maskedNumber: "5678-12**-****-***9",
    isDefault: false,
  },
];

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  );
}

function renderCards() {
  return renderHook(
    () => ({
      cards: useBillingCards(),
      setDefault: useSetDefaultBillingCard(),
    }),
    { wrapper },
  );
}

function defaultIdOf(cards: { id: string; isDefault: boolean }[] | undefined) {
  return cards?.find((card) => card.isDefault)?.id;
}

beforeEach(() => {
  vi.mocked(serverApiV3.get).mockReset().mockResolvedValue(CARDS);
  vi.mocked(serverApiV3.put).mockReset();
});

describe("useSetDefaultBillingCard", () => {
  it("기본 카드를 바꾸는 API를 부르고 목록을 서버 값으로 다시 읽는다", async () => {
    vi.mocked(serverApiV3.put).mockResolvedValue(undefined);
    const { result } = renderCards();
    await waitFor(() => expect(result.current.cards.data).toHaveLength(2));
    vi.mocked(serverApiV3.get).mockResolvedValue(
      CARDS.map((card) => ({ ...card, isDefault: card.id === "card-2" })),
    );

    await act(() => result.current.setDefault("card-2"));

    expect(serverApiV3.put).toHaveBeenCalledWith(
      "/mypage/subscription/billing-cards/card-2/default",
    );
    await waitFor(() =>
      expect(defaultIdOf(result.current.cards.data)).toBe("card-2"),
    );
    // 새 기본 카드가 맨 앞으로 옴.
    expect(result.current.cards.data?.[0]?.id).toBe("card-2");
  });

  it("실패하면 목록을 되돌리고 에러를 던진다", async () => {
    const failure = { reason: "BILLING_CARD_NOT_FOUND" };
    vi.mocked(serverApiV3.put).mockRejectedValue(failure);
    const { result } = renderCards();
    await waitFor(() => expect(result.current.cards.data).toHaveLength(2));

    await act(async () => {
      await expect(result.current.setDefault("card-2")).rejects.toBe(failure);
    });

    expect(defaultIdOf(result.current.cards.data)).toBe("card-1");
    expect(result.current.cards.data?.[0]?.id).toBe("card-1");
  });
});
