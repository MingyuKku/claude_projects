import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ChargeInline } from "./ChargeInline";

const requestCharge = vi.hoisted(() => vi.fn());

vi.mock("../api/charge-request-api", () => ({ requestCharge }));

const RETURN_PATH = "/campaign/register/CMP-1";

beforeEach(() => requestCharge.mockReset().mockResolvedValue(undefined));

// Radix ScrollArea(약관 팝업 본문 스크롤)가 쓰는 브라우저 API가 jsdom에 없어 이 파일에서만 채움.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("ChargeInline", () => {
  it("금액이 없으면 충전하기가 비활성이고, 최소 이상이면 활성이다", async () => {
    const user = userEvent.setup();
    render(<ChargeInline returnPath={RETURN_PATH} />);
    const cta = () => screen.getByRole("button", { name: /원 충전하기$/ });

    expect(cta()).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "10만 원" }));

    expect(cta()).toBeEnabled();
  });

  it("약관에 동의하면 입력 금액과 복귀 경로로 결제를 요청한다", async () => {
    const user = userEvent.setup();
    render(<ChargeInline returnPath={RETURN_PATH} />);

    await user.type(
      screen.getByRole("textbox", { name: "충전 금액 입력" }),
      "155500",
    );
    await user.click(screen.getByRole("button", { name: /원 충전하기$/ }));
    expect(requestCharge).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "동의 및 충전하기" }));

    expect(requestCharge).toHaveBeenCalledWith(155500, RETURN_PATH);
  });
});
