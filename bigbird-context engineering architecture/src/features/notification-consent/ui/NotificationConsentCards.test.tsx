import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { NotificationConsentCards } from "./NotificationConsentCards";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

beforeEach(() => {
  vi.mocked(toast).mockReset();
});

describe("NotificationConsentCards", () => {
  it("알림톡·푸시 카드와 필수 알림 안내를 보인다", () => {
    render(<NotificationConsentCards />);
    expect(
      screen.getByRole("heading", { name: "알림톡 알림" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "푸시 알림" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("switch")).toHaveLength(4);
    expect(
      screen.getByText(
        "서비스 운영 및 중요 안내 등 필수 알림은 동의 여부와 관계없이 발송됩니다.",
      ),
    ).toBeInTheDocument();
  });

  it("푸시 야간 설명은 알림톡이 아니라 푸시 알림으로 쓴다", () => {
    render(<NotificationConsentCards />);
    expect(
      screen.getByText(
        "야간(오후 9시~오전 8시)에 광고성 푸시 알림을 받을 수 있습니다.",
      ),
    ).toBeInTheDocument();
  });

  it("스위치를 바꾸면 준비 중으로 안내하고 값은 그대로 둔다", async () => {
    const user = userEvent.setup();
    render(<NotificationConsentCards />);
    const [first] = screen.getAllByRole("switch");
    const before = first!.getAttribute("aria-checked");
    await user.click(first!);
    expect(toast).toHaveBeenCalledWith("준비 중인 기능입니다.");
    expect(first).toHaveAttribute("aria-checked", before);
  });
});
