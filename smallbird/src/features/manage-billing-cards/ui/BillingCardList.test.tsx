import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import {
  deleteBillingCard,
  requestCardIssuance,
  submitIssuanceForm,
  useBillingCards,
  useSetDefaultBillingCard,
  useSubscriptions,
} from "@/entities/subscription";

import { BillingCardList } from "./BillingCardList";

import type { BillingCard, Subscription } from "@/entities/subscription";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));
vi.mock("@/entities/subscription", () => ({
  useBillingCards: vi.fn(),
  useSetDefaultBillingCard: vi.fn(),
  useSubscriptions: vi.fn(),
  deleteBillingCard: vi.fn(),
  requestCardIssuance: vi.fn(),
  submitIssuanceForm: vi.fn(),
  readApiErrorReason: (error: unknown) => (error as { reason?: string }).reason,
}));

const defaultCard: BillingCard = {
  id: "card-1",
  issuer: "하나카드",
  maskedNumber: "1234-56**-****-***7",
  isDefault: true,
  cardKind: "credit",
};
const extraCard: BillingCard = {
  id: "card-2",
  issuer: "신한카드",
  maskedNumber: "5678-12**-****-***9",
  isDefault: false,
  cardKind: "debit",
};

// 카드별 ⋮ 메뉴 버튼 이름("{카드사} {번호} 카드 메뉴").
const DEFAULT_MENU = /하나카드.*카드 메뉴/;
const EXTRA_MENU = /신한카드.*카드 메뉴/;

const setDefault = vi.fn<(cardId: string) => Promise<void>>();
const mutate =
  vi.fn<
    (action: () => Promise<unknown>, options?: unknown) => Promise<undefined>
  >();

function subscription(status: Subscription["status"]): Subscription {
  return {
    id: "sub-1",
    type: "recruit",
    productName: "월 구독 상품_모집형",
    startedAt: "2026-11-02",
    endsAt: "2026-12-02",
    amount: 99000,
    paymentMethod: "card",
    cardKind: "credit",
    isCancelScheduled: status === "cancelScheduled",
    status,
    nextRetryAt: status === "paymentFailed" ? "2026-11-04" : null,
  };
}

function setup(
  cards: BillingCard[],
  subscriptions: Subscription[] | undefined = [],
  { isSubscriptionsLoading = false } = {},
) {
  vi.mocked(deleteBillingCard).mockReset().mockResolvedValue(undefined);
  setDefault.mockReset().mockResolvedValue(undefined);
  mutate.mockReset().mockImplementation(async (action) => {
    await action();
    return undefined;
  });
  vi.mocked(useSetDefaultBillingCard).mockReturnValue(setDefault);
  vi.mocked(useSubscriptions).mockReturnValue({
    data: subscriptions,
    isLoading: isSubscriptionsLoading,
    isError: false,
    mutate: vi.fn(),
  } as never);
  vi.mocked(requestCardIssuance).mockReset();
  vi.mocked(submitIssuanceForm).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(useBillingCards).mockReturnValue({
    data: cards,
    isLoading: false,
    isError: false,
    mutate: mutate as never,
  });
  render(<BillingCardList />);
  return userEvent.setup();
}

describe("BillingCardList", () => {
  it("카드 추가를 누르면 결제창 값을 받아 이동한다", async () => {
    const form = { action: "https://pay.example/card", fields: { a: "1" } };
    const user = setup([]);
    vi.mocked(requestCardIssuance).mockResolvedValue(form);

    await user.click(screen.getByRole("button", { name: "카드 추가" }));

    expect(requestCardIssuance).toHaveBeenCalledOnce();
    expect(submitIssuanceForm).toHaveBeenCalledWith(form);
  });

  it("결제창 값을 받지 못하면 토스트로 알리고 이동하지 않는다", async () => {
    const user = setup([]);
    vi.mocked(requestCardIssuance).mockRejectedValue(new Error("fail"));

    await user.click(screen.getByRole("button", { name: "카드 추가" }));

    expect(toast.error).toHaveBeenCalledWith(
      "카드를 등록하지 못했습니다. 다시 시도해 주세요.",
    );
    expect(submitIssuanceForm).not.toHaveBeenCalled();
  });

  it("카드가 없으면 카드 추가 칸만 보인다", () => {
    setup([]);
    expect(screen.getByRole("button", { name: "카드 추가" })).toBeVisible();
    expect(screen.queryByText("기본 카드")).toBeNull();
  });

  it("카드 1장이면 기본 카드와 카드 추가 칸을 보이고 기본 카드 메뉴에는 카드 삭제만 있다", async () => {
    const user = setup([defaultCard]);
    expect(screen.getByText("기본 카드")).toBeVisible();
    expect(screen.getByRole("button", { name: "카드 추가" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /카드 메뉴/ }));

    expect(
      await screen.findByRole("menuitem", { name: "카드 삭제" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("menuitem", { name: "결제 카드로 등록" }),
    ).toBeNull();
  });

  it("카드 2장이면 카드 추가 칸이 없고 기본 카드에는 메뉴가 없으며 여분 카드에만 삭제·결제 카드로 등록이 있다", async () => {
    const user = setup([defaultCard, extraCard]);
    expect(screen.queryByRole("button", { name: "카드 추가" })).toBeNull();
    expect(screen.getAllByRole("button", { name: /카드 메뉴/ })).toHaveLength(
      1,
    );
    expect(screen.queryByRole("button", { name: DEFAULT_MENU })).toBeNull();

    await user.click(screen.getByRole("button", { name: EXTRA_MENU }));
    expect(
      await screen.findByRole("menuitem", { name: "카드 삭제" }),
    ).toBeVisible();
    expect(
      screen.getByRole("menuitem", { name: "결제 카드로 등록" }),
    ).toBeVisible();
  });

  it("여분 카드 삭제는 확인 알럿 뒤 삭제 API를 부르고 목록은 그대로 두고 그 카드만 뺀다", async () => {
    const user = setup([defaultCard, extraCard]);
    await user.click(screen.getByRole("button", { name: EXTRA_MENU }));
    await user.click(
      await screen.findByRole("menuitem", { name: "카드 삭제" }),
    );
    expect(
      await screen.findByRole("alertdialog", { name: "카드 삭제" }),
    ).toHaveTextContent(
      "신한카드 5678-12**-****-***9 카드를 삭제하시겠습니까?",
    );
    await user.click(screen.getByRole("button", { name: "삭제" }));

    expect(deleteBillingCard).toHaveBeenCalledWith("card-2");
    expect(mutate).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ optimisticData: [defaultCard] }),
    );
  });

  it("마지막 카드(기본 카드)를 삭제하면 카드가 하나도 없는 목록으로 먼저 바뀐다", async () => {
    const user = setup([defaultCard]);
    await user.click(screen.getByRole("button", { name: /카드 메뉴/ }));
    await user.click(
      await screen.findByRole("menuitem", { name: "카드 삭제" }),
    );
    await user.click(await screen.findByRole("button", { name: "삭제" }));

    expect(deleteBillingCard).toHaveBeenCalledWith("card-1");
    expect(mutate).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ optimisticData: [] }),
    );
  });

  it.each(["active", "paymentFailed"] as const)(
    "%s 구독이 있으면 한 장뿐인 기본 카드에도 삭제 메뉴가 없다",
    (status) => {
      setup([defaultCard], [subscription(status)]);
      expect(screen.queryByRole("button", { name: /카드 메뉴/ })).toBeNull();
    },
  );

  it("해지 예정 구독만 있으면 삭제 메뉴를 보이고 서버가 거절하면 이유를 토스트로 알린다", async () => {
    const user = setup([defaultCard], [subscription("cancelScheduled")]);
    vi.mocked(deleteBillingCard).mockRejectedValue({
      reason: "DEFAULT_CARD_IN_USE",
    });
    await user.click(screen.getByRole("button", { name: DEFAULT_MENU }));
    await user.click(
      await screen.findByRole("menuitem", { name: "카드 삭제" }),
    );
    await user.click(await screen.findByRole("button", { name: "삭제" }));
    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("기본 카드는 삭제할 수 없습니다"),
      ),
    );
  });

  it("구독 목록 읽기에 실패했으면 삭제 메뉴를 보이고 서버 판단에 맡긴다", () => {
    setup([defaultCard], undefined);
    expect(screen.getByRole("button", { name: DEFAULT_MENU })).toBeVisible();
  });

  it("구독 목록을 읽는 중에는 한 장뿐인 기본 카드의 삭제 메뉴가 보이지 않는다", () => {
    setup([defaultCard], undefined, { isSubscriptionsLoading: true });
    expect(screen.queryByRole("button", { name: /카드 메뉴/ })).toBeNull();
  });

  it("결제 카드로 등록은 변경 API 뒤 완료 알럿을 연다", async () => {
    const user = setup([defaultCard, extraCard]);
    await user.click(screen.getByRole("button", { name: EXTRA_MENU }));
    await user.click(
      await screen.findByRole("menuitem", { name: "결제 카드로 등록" }),
    );
    await screen.findByRole("alertdialog", { name: "결제카드 변경" });
    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(setDefault).toHaveBeenCalledWith("card-2");
    expect(
      await screen.findByRole("alertdialog", { name: "결제카드 변경 완료" }),
    ).toBeVisible();
  });
});
