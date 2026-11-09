import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { toast } from "sonner";
import { SWRConfig } from "swr";

import { CancelApprovalButton } from "./CancelApprovalButton";
import { ReapprovalButton } from "./ReapprovalButton";

const api = vi.hoisted(() => ({ cancel: vi.fn(), reapprove: vi.fn() }));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/entities/bigbird-money", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useBigbirdMoneyBalance: () => ({
    balance: undefined,
    mutate: async () => undefined,
  }),
}));
vi.mock("@/entities/campaign", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  cancelCampaignApproval: api.cancel,
  requestCampaignReapproval: api.reapprove,
}));

function Location() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{`${pathname}${search}`}</output>;
}

function setup(ui: React.ReactNode) {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <MemoryRouter initialEntries={["/campaign/7"]}>
        {ui}
        <Location />
      </MemoryRouter>
    </SWRConfig>,
  );
  return userEvent.setup();
}

beforeEach(() => {
  api.cancel
    .mockReset()
    .mockResolvedValue({ status: "DRAFT", refundedAmount: 0, balance: 0 });
  api.reapprove.mockReset().mockResolvedValue({ status: "RE_REVIEWING" });
  vi.mocked(toast.error).mockClear();
});

describe("승인 요청 취소", () => {
  it("확인 알럿은 환불 안내를 보이고 닫기만 하면 요청하지 않는다", async () => {
    const user = setup(<CancelApprovalButton campaign={{ campaignIdx: 7 }} />);

    await user.click(screen.getByRole("button", { name: "승인 요청 취소" }));
    const alert = await screen.findByRole("alertdialog");
    expect(alert).toHaveTextContent("결제하신 금액이 환불되고");

    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(api.cancel).not.toHaveBeenCalled();
    expect(screen.getByTestId("location")).toHaveTextContent("/campaign/7");
  });

  it("승인 요청 취소하기를 누르면 취소하고 작성 화면 8단계로 교체 이동한다", async () => {
    const user = setup(<CancelApprovalButton campaign={{ campaignIdx: 7 }} />);

    await user.click(screen.getByRole("button", { name: "승인 요청 취소" }));
    await user.click(
      await screen.findByRole("button", { name: "승인 요청 취소하기" }),
    );

    await vi.waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/campaign/register/7?step=payment",
      ),
    );
    expect(api.cancel).toHaveBeenCalledWith(7);
  });

  it("취소에 실패하면 토스트를 띄우고 알럿과 화면을 그대로 둔다", async () => {
    api.cancel.mockRejectedValue(new Error("network"));
    const user = setup(<CancelApprovalButton campaign={{ campaignIdx: 7 }} />);

    await user.click(screen.getByRole("button", { name: "승인 요청 취소" }));
    await user.click(
      await screen.findByRole("button", { name: "승인 요청 취소하기" }),
    );

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      ),
    );
    expect(screen.getByRole("alertdialog")).toBeVisible();
    expect(screen.getByTestId("location")).toHaveTextContent("/campaign/7");
  });
});

describe("재승인 요청", () => {
  it("요청하면 완료 알럿을 보이고 확인으로 닫는다", async () => {
    const user = setup(<ReapprovalButton campaign={{ campaignIdx: 7 }} />);

    await user.click(screen.getByRole("button", { name: "재승인 요청" }));

    const alert = await screen.findByRole("alertdialog");
    expect(alert).toHaveTextContent("재승인 요청이 완료되었습니다.");
    expect(api.reapprove).toHaveBeenCalledWith(7);

    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("횟수 초과 등으로 거절되면 토스트만 띄운다", async () => {
    api.reapprove.mockRejectedValue(new Error("limit"));
    const user = setup(<ReapprovalButton campaign={{ campaignIdx: 7 }} />);

    await user.click(screen.getByRole("button", { name: "재승인 요청" }));

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      ),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
