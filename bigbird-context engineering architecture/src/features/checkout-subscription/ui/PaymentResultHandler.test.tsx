import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { toast } from "sonner";

import { PaymentResultHandler } from "./PaymentResultHandler";

const revalidate = vi.fn();

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/entities/subscription", () => ({
  useRevalidateSubscriptionData: () => revalidate,
}));

function Search() {
  return <output data-testid="search">{useLocation().search}</output>;
}

function setup(search: string) {
  render(
    <MemoryRouter initialEntries={[`/mypage/subscribe${search}`]}>
      <PaymentResultHandler />
      <Search />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  revalidate.mockReset();
  vi.mocked(toast.error).mockReset();
});

describe("PaymentResultHandler", () => {
  it("결과 쿼리가 없으면 아무것도 하지 않는다", () => {
    setup("");
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(revalidate).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("성공이면 구독 데이터를 다시 읽고 완료 알럿을 연다. 확인하면 쿼리를 지운다", async () => {
    setup("?result=success&subscriptionId=12");
    expect(screen.getByText("구독 결제가 완료되었습니다.")).toBeInTheDocument();
    expect(revalidate).toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "확인" }));

    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent(/^$/),
    );
  });

  it("카드 추가 성공(cardId)은 결제 완료로 다루지 않는다", () => {
    setup("?result=success&cardId=32");
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(revalidate).not.toHaveBeenCalled();
  });

  it("실패면 이유를 토스트로 알리고 쿼리를 지운다", async () => {
    setup("?result=fail&reason=PAYMENT_FAILED");

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "결제에 실패했습니다. 다시 시도해 주세요.",
        expect.anything(),
      ),
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent(/^$/),
    );
  });
});
