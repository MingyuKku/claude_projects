import { act, render, screen, waitFor } from "@testing-library/react";
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
  sessionStorage.clear();
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

  it("등록 전에 남긴 돌아올 쿼리가 있으면 새 카드 목록을 받은 뒤 그 화면으로 옮긴다", async () => {
    sessionStorage.setItem(
      "billing-card-return-params",
      JSON.stringify({ panel: "checkout", plan: "pick", period: "yearly" }),
    );
    let finishRevalidate: () => void = () => {};
    revalidate.mockReturnValue(
      new Promise<void>((resolve) => {
        finishRevalidate = resolve;
      }),
    );
    setup("?result=success&cardId=32");

    await waitFor(() => expect(revalidate).toHaveBeenCalledOnce());
    // 새 목록을 받기 전에는 옮기지 않음(0장으로 읽은 목록 때문에 카드 없음 안내가 다시 뜨지 않게).
    expect(screen.getByTestId("search")).toHaveTextContent(
      "?result=success&cardId=32",
    );

    await act(async () => finishRevalidate());
    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent(
        "?panel=checkout&plan=pick&period=yearly",
      ),
    );
    expect(sessionStorage.getItem("billing-card-return-params")).toBeNull();
  });

  it("구독 결제 성공(subscriptionId)은 처리하지 않는다", () => {
    setup("?result=success&subscriptionId=12");
    expect(toast.success).not.toHaveBeenCalled();
    expect(revalidate).not.toHaveBeenCalled();
  });
});
