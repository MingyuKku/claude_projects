import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import {
  deleteBillingCard,
  requestCardIssuance,
  setDefaultBillingCard,
  submitIssuanceForm,
  useBillingCards,
} from "@/entities/subscription";

import { BillingCardList } from "./BillingCardList";

import type { BillingCard } from "@/entities/subscription";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));
vi.mock("@/entities/subscription", () => ({
  useBillingCards: vi.fn(),
  deleteBillingCard: vi.fn(),
  setDefaultBillingCard: vi.fn(),
  requestCardIssuance: vi.fn(),
  submitIssuanceForm: vi.fn(),
  readApiErrorReason: (error: unknown) => (error as { reason?: string }).reason,
}));

const defaultCard: BillingCard = {
  id: "card-1",
  issuer: "하나카드",
  maskedNumber: "1234-56**-****-***7",
  isDefault: true,
};
const extraCard: BillingCard = {
  id: "card-2",
  issuer: "신한카드",
  maskedNumber: "5678-12**-****-***9",
  isDefault: false,
};

function setup(cards: BillingCard[]) {
  vi.mocked(deleteBillingCard).mockReset().mockResolvedValue(undefined);
  vi.mocked(setDefaultBillingCard).mockReset().mockResolvedValue(undefined);
  vi.mocked(requestCardIssuance).mockReset();
  vi.mocked(submitIssuanceForm).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(useBillingCards).mockReturnValue({
    data: cards,
    isLoading: false,
    isError: false,
    mutate: vi.fn(async (action: () => Promise<unknown>) => {
      await action();
      return undefined;
    }) as never,
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

  it("카드 1장이면 기본 카드(메뉴 없음)와 카드 추가 칸을 보인다", () => {
    setup([defaultCard]);
    expect(screen.getByText("기본 카드")).toBeVisible();
    expect(screen.queryByRole("button", { name: /카드 메뉴/ })).toBeNull();
    expect(screen.getByRole("button", { name: "카드 추가" })).toBeVisible();
  });

  it("카드 2장이면 카드 추가 칸이 없고 여분 카드에만 메뉴가 있다", () => {
    setup([defaultCard, extraCard]);
    expect(screen.queryByRole("button", { name: "카드 추가" })).toBeNull();
    expect(screen.getAllByRole("button", { name: /카드 메뉴/ })).toHaveLength(
      1,
    );
  });

  it("카드 삭제는 확인 알럿 뒤 삭제 API를 부른다", async () => {
    const user = setup([defaultCard, extraCard]);
    await user.click(screen.getByRole("button", { name: /카드 메뉴/ }));
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
  });

  it("기본 카드 삭제가 거절되면 이유를 토스트로 알린다", async () => {
    const user = setup([defaultCard, extraCard]);
    vi.mocked(deleteBillingCard).mockRejectedValue({
      reason: "DEFAULT_CARD_IN_USE",
    });
    await user.click(screen.getByRole("button", { name: /카드 메뉴/ }));
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

  it("결제 카드로 등록은 변경 API 뒤 완료 알럿을 연다", async () => {
    const user = setup([defaultCard, extraCard]);
    await user.click(screen.getByRole("button", { name: /카드 메뉴/ }));
    await user.click(
      await screen.findByRole("menuitem", { name: "결제 카드로 등록" }),
    );
    await screen.findByRole("alertdialog", { name: "결제카드 변경" });
    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(setDefaultBillingCard).toHaveBeenCalledWith("card-2");
    expect(
      await screen.findByRole("alertdialog", { name: "결제카드 변경 완료" }),
    ).toBeVisible();
  });
});
