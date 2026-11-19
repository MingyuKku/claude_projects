import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";

import { usePaymentReturn } from "./use-payment-return";

import type { ReactNode } from "react";

function setup(
  initialEntry: string,
  options: { nextSearchParams?: Record<string, string> } = {},
) {
  const onReturned = vi.fn(() => Promise.resolve());

  function wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={["/prev", initialEntry]} initialIndex={1}>
        {children}
      </MemoryRouter>
    );
  }

  const hook = renderHook(
    () => ({
      paymentReturn: usePaymentReturn({
        onReturned,
        nextSearchParams: options.nextSearchParams,
      }),
      location: useLocation(),
      navigate: useNavigate(),
    }),
    { wrapper },
  );
  return { ...hook, onReturned };
}

describe("usePaymentReturn", () => {
  it("isPaid=true로 돌아오면 알럿을 띄우고, 결제 서버가 붙인 쿼리를 이름과 상관없이 모두 지운 뒤 한 번 다시 읽는다", async () => {
    const { result, onReturned } = setup(
      "/money?isPaid=true&gopaymethod=VBank&accountNumber=1234567890&holderName=%ED%99%8D&dueDate=20261106",
    );

    await waitFor(() => expect(result.current.location.search).toBe(""));
    expect(result.current.paymentReturn.isRequested).toBe(true);
    expect(result.current.paymentReturn.isClearingQuery).toBe(false);
    expect(onReturned).toHaveBeenCalledTimes(1);
  });

  it("결제 주소는 방문 기록을 바꿔 써서 뒤로 가면 결제 전 화면으로 간다", async () => {
    const { result } = setup("/money?isPaid=true");

    await waitFor(() => expect(result.current.location.search).toBe(""));
    act(() => result.current.navigate(-1));
    expect(result.current.location.pathname).toBe("/prev");
  });

  it("nextSearchParams가 있으면 결제 쿼리를 지우고 그 쿼리만 남긴다", async () => {
    const { result } = setup(
      "/campaign/register/1?isPaid=true&gopaymethod=VBank",
      { nextSearchParams: { step: "payment" } },
    );

    await waitFor(() =>
      expect(result.current.location.search).toBe("?step=payment"),
    );
    expect(result.current.paymentReturn.isRequested).toBe(true);
  });

  it.each(["USER_CANCELED", "PAYMENT_FAILED"])(
    "결제 실패·취소(isPaid=false&code=%s)로 돌아오면 알럿 없이 쿼리를 지우고 다시 읽는다",
    async (code) => {
      const { result, onReturned } = setup(`/money?isPaid=false&code=${code}`);

      await waitFor(() => expect(result.current.location.search).toBe(""));
      expect(result.current.paymentReturn.isRequested).toBe(false);
      expect(onReturned).toHaveBeenCalledTimes(1);
    },
  );

  it("isPaid가 없으면 쿼리를 그대로 두고 다시 읽지 않는다", () => {
    const { result, onReturned } = setup("/money?view=history");

    expect(result.current.location.search).toBe("?view=history");
    expect(result.current.paymentReturn.isRequested).toBe(false);
    expect(result.current.paymentReturn.isClearingQuery).toBe(false);
    expect(onReturned).not.toHaveBeenCalled();
  });

  it("closeAlert를 부르면 알럿을 닫는다", async () => {
    const { result } = setup("/money?isPaid=true");
    await waitFor(() => expect(result.current.location.search).toBe(""));

    act(() => result.current.paymentReturn.closeAlert());
    expect(result.current.paymentReturn.isRequested).toBe(false);
  });
});
