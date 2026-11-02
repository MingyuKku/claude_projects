import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { toast } from "sonner";

import { BillingCardResultHandler } from "./BillingCardResultHandler";

const revalidate = vi.fn();

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("@/entities/subscription", () => ({
  useRevalidateSubscriptionData: () => revalidate,
}));

function Search() {
  return <output data-testid="search">{useLocation().search}</output>;
}

function setup(search: string) {
  render(
    <MemoryRouter initialEntries={[`/mypage/subscribe${search}`]}>
      <BillingCardResultHandler
        onRegistered={(params) => params.set("tab", "payments")}
      />
      <Search />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  revalidate.mockReset();
  vi.mocked(toast.success).mockReset();
});

describe("BillingCardResultHandler", () => {
  it("결과 쿼리가 없으면 아무것도 하지 않는다", () => {
    setup("");
    expect(toast.success).not.toHaveBeenCalled();
    expect(revalidate).not.toHaveBeenCalled();
  });

  it("카드 추가 성공이면 목록을 다시 읽고 토스트를 띄우고 결제내역 탭으로 옮긴다", async () => {
    setup("?result=success&cardId=32");

    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent("?tab=payments"),
    );
    expect(toast.success).toHaveBeenCalledWith(
      "카드가 등록되었습니다.",
      expect.anything(),
    );
    expect(revalidate).toHaveBeenCalledOnce();
  });

  it("구독 결제 성공(subscriptionId)은 처리하지 않는다", () => {
    setup("?result=success&subscriptionId=12");
    expect(toast.success).not.toHaveBeenCalled();
    expect(revalidate).not.toHaveBeenCalled();
  });
});
