import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import { PaymentDialogs } from "./PaymentDialogs";

import type { PaymentDialog } from "../model/use-payment-flow";

function renderDialogs(dialog: PaymentDialog) {
  const calls: string[] = [];
  const props = {
    onClose: () => calls.push("close"),
    onGoToStep: () => calls.push("goToStep"),
    onLeaveToDetail: () => calls.push("leave"),
    onCompleteDemo: () => calls.push("demo"),
    onApprovalRequested: () => calls.push("approvalRequested"),
  };
  render(
    <MemoryRouter>
      <PaymentDialogs dialog={dialog} isBusy={false} {...props} />
    </MemoryRouter>,
  );
  return calls;
}

describe("PaymentDialogs 승인 요청 알림", () => {
  it.each<PaymentDialog>([
    { type: "completed" },
    { type: "reapprovalCompleted" },
  ])(
    "%o 알럿의 확인을 누르면 등록 내역으로 가기 전에 알림 권한 요청을 부른다",
    async (dialog) => {
      const calls = renderDialogs(dialog);

      await userEvent.click(screen.getByRole("button", { name: "확인" }));

      expect(calls).toEqual(["close", "approvalRequested", "leave"]);
    },
  );

  it("결제가 실패한 알럿에서는 알림 권한을 묻지 않는다", async () => {
    const calls = renderDialogs({ type: "failed" });

    await userEvent.click(screen.getByRole("button", { name: "확인" }));

    expect(calls).not.toContain("approvalRequested");
  });
});
