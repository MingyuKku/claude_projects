import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ChargePanel } from "./ChargePanel";

const requestCharge = vi.hoisted(() => vi.fn());

vi.mock("@/entities/bigbird-money", () => ({
  useBigbirdMoneyBalance: () => ({ balance: { amount: 10000 } }),
  BalanceCard: ({ amount }: { amount?: number }) => <p>보유 {amount}원</p>,
}));
vi.mock("../api/charge-request-api", () => ({ requestCharge }));

beforeEach(() => requestCharge.mockReset().mockResolvedValue(undefined));

function setup() {
  const onClose = vi.fn();
  render(<ChargePanel onClose={onClose} />);
  return {
    onClose,
    user: userEvent.setup(),
    input: screen.getByRole("textbox", { name: "충전 금액 입력" }),
    cta: () => screen.getByRole("button", { name: /원 충전하기$/ }),
  };
}

describe("ChargePanel", () => {
  it("처음에는 0원이고 충전 버튼이 비활성이다", () => {
    const { cta } = setup();
    expect(cta()).toHaveTextContent("0원 충전하기");
    expect(cta()).toBeDisabled();
  });

  it("숫자만 받고 천 단위로 보이며 버튼에 금액이 반영된다", async () => {
    const { user, input, cta } = setup();
    await user.type(input, "15a500");
    expect(input).toHaveValue("15,500");
    expect(cta()).toHaveTextContent("15,500원 충전하기");
    expect(cta()).toBeEnabled();
  });

  it("충전하기를 누르면 약관 팝업이 열리고 동의 전에는 결제를 요청하지 않는다", async () => {
    const { user, input, cta } = setup();
    await user.type(input, "15500");
    await user.click(cta());
    const dialog = screen.getByRole("dialog", {
      name: "광고주 결제 정보 수집 및 약관",
    });
    expect(dialog).toHaveTextContent(
      "제 1 조 (비즈 머니의 충전, 환불, 소멸 등)",
    );
    expect(requestCharge).not.toHaveBeenCalled();
  });

  it("약관 팝업에서 취소하면 결제를 요청하지 않고 닫는다", async () => {
    const { user, input, cta } = setup();
    await user.type(input, "15500");
    await user.click(cta());
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(requestCharge).not.toHaveBeenCalled();
  });

  it("빠른 금액은 입력값에 더한다", async () => {
    const { user, input } = setup();
    await user.click(screen.getByRole("button", { name: "1만 원" }));
    await user.click(screen.getByRole("button", { name: "3만 원" }));
    expect(input).toHaveValue("40,000");
  });

  it("최소 미만이면 오류 문구를 보이고 버튼이 비활성이다", async () => {
    const { user, input, cta } = setup();
    await user.type(input, "999");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "최소 1,000원부터 충전할 수 있습니다.",
    );
    expect(cta()).toBeDisabled();
  });

  it("한도를 넘기면 값은 두고 오류 문구를 보이며 버튼이 비활성이다", async () => {
    const { user, cta } = setup();
    await user.click(screen.getByRole("button", { name: "10만 원" }));
    for (let i = 0; i < 10; i += 1) {
      await user.click(screen.getByRole("button", { name: "10만 원" }));
    }
    expect(screen.getByRole("alert")).toHaveTextContent(
      "1회 최대 1,000,000원까지 충전할 수 있습니다.",
    );
    expect(cta()).toBeDisabled();
  });

  it("약관에 동의하면 입력 금액으로 결제를 요청한다", async () => {
    const { user, input, cta } = setup();
    await user.type(input, "15500");
    await user.click(cta());
    await user.click(screen.getByRole("button", { name: "동의 및 충전하기" }));
    expect(requestCharge).toHaveBeenCalledWith(15500);
  });

  it("닫기를 누르면 닫는다", async () => {
    const { user, onClose } = setup();
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(onClose).toHaveBeenCalled();
  });
});
