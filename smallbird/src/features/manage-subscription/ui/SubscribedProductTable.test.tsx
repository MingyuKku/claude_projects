import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { cancelSubscription } from "@/entities/subscription";

import { SubscribedProductTable } from "./SubscribedProductTable";

import type { Subscription } from "@/entities/subscription";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));
vi.mock("@/entities/subscription", () => ({
  cancelSubscription: vi.fn(),
  useSubscriptions: () => ({ mutate: vi.fn().mockResolvedValue(undefined) }),
  readApiErrorReason: (error: unknown) => (error as { reason?: string }).reason,
  usePaymentMethodLabel: () => (value: string) =>
    value === "card" ? "신용카드(일반)" : value,
}));

const active: Subscription = {
  id: "sub-1",
  type: "recruit",
  productName: "월 구독 상품_모집형",
  startedAt: "2026-10-01",
  endsAt: "2026-10-31",
  amount: 99999,
  paymentMethod: "card",
  cardKind: "credit",
  isCancelScheduled: false,
};

function setup(subscriptions: Subscription[]) {
  vi.mocked(cancelSubscription).mockReset().mockResolvedValue({
    subscriptionId: "sub-1",
    serviceEndAt: "2026-10-31",
  });
  vi.mocked(toast.error).mockReset();
  render(<SubscribedProductTable subscriptions={subscriptions} />);
  return userEvent.setup();
}

describe("SubscribedProductTable", () => {
  it("구독 결제 상품이 없으면 빈 상태를 보인다", () => {
    setup([]);
    expect(screen.getByText("구독 결제한 상품이 없습니다.")).toBeVisible();
  });

  it("구독해지는 종료일을 넣은 확인 알럿 뒤 해지 API와 완료 알럿으로 끝난다", async () => {
    const user = setup([active]);
    expect(screen.getByText("99,999원")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "구독해지" }));
    expect(
      await screen.findByRole("alertdialog", { name: "구독 해지" }),
    ).toHaveTextContent("2026년 10월 31일까지는 구독이 유지됩니다.");
    await user.click(screen.getByRole("button", { name: "해지" }));
    expect(cancelSubscription).toHaveBeenCalledWith("sub-1");
    expect(
      await screen.findByRole("alertdialog", { name: "구독 해지 완료" }),
    ).toBeVisible();
  });

  it("이미 해지된 구독이면 토스트로 알리고 완료 알럿을 열지 않는다", async () => {
    const user = setup([active]);
    vi.mocked(cancelSubscription).mockRejectedValue({
      reason: "ALREADY_CANCELED",
    });
    await user.click(screen.getByRole("button", { name: "구독해지" }));
    await user.click(await screen.findByRole("button", { name: "해지" }));
    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("이미 해지된 구독입니다."),
    );
    expect(
      screen.queryByRole("alertdialog", { name: "구독 해지 완료" }),
    ).toBeNull();
  });

  it("해지 예정인 상품은 비활성 해지 예정 버튼을 보인다", () => {
    setup([{ ...active, isCancelScheduled: true }]);
    expect(screen.getByRole("button", { name: "해지 예정" })).toBeDisabled();
  });
});
